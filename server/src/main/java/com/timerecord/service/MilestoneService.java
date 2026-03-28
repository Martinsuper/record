package com.timerecord.service;

import com.timerecord.dto.*;
import com.timerecord.entity.Milestone;
import com.timerecord.entity.MilestoneStage;
import com.timerecord.exception.ResourceNotFoundException;
import com.timerecord.repository.MilestoneRepository;
import com.timerecord.repository.MilestoneStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final MilestoneStageRepository stageRepository;

    public List<MilestoneDto> getAllByUser(Long userId) {
        return milestoneRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toDtoWithStages)
            .collect(Collectors.toList());
    }

    public List<MilestoneDto> getByStatus(Long userId, Milestone.Status status) {
        return milestoneRepository.findByUserIdAndStatus(userId, status)
            .stream()
            .map(this::toDtoWithStages)
            .collect(Collectors.toList());
    }

    public MilestoneDto getById(Long id, Long userId) {
        Milestone milestone = findByIdAndUserId(id, userId);
        return toDtoWithStages(milestone);
    }

    @Transactional
    public MilestoneDto create(Long userId, MilestoneCreateRequest request) {
        Milestone milestone = new Milestone();
        milestone.setUserId(userId);
        milestone.setTitle(request.getTitle());
        milestone.setDescription(request.getDescription());
        milestone.setTargetDate(request.getTargetDate());

        milestone = milestoneRepository.save(milestone);

        if (request.getStages() != null && !request.getStages().isEmpty()) {
            for (MilestoneStageCreateRequest stageReq : request.getStages()) {
                MilestoneStage stage = new MilestoneStage();
                stage.setMilestoneId(milestone.getId());
                stage.setTitle(stageReq.getTitle());
                stage.setTargetDate(stageReq.getTargetDate());
                stage.setSortOrder(stageReq.getSortOrder());
                stageRepository.save(stage);
            }
        }

        return getById(milestone.getId(), userId);
    }

    @Transactional
    public MilestoneDto update(Long id, Long userId, MilestoneCreateRequest request) {
        Milestone milestone = findByIdAndUserId(id, userId);
        milestone.setTitle(request.getTitle());
        milestone.setDescription(request.getDescription());
        milestone.setTargetDate(request.getTargetDate());

        milestoneRepository.save(milestone);
        return getById(id, userId);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Milestone milestone = findByIdAndUserId(id, userId);
        stageRepository.deleteByMilestoneId(id);
        milestoneRepository.delete(milestone);
    }

    @Transactional
    public MilestoneDto addStage(Long milestoneId, Long userId, MilestoneStageCreateRequest request) {
        Milestone milestone = findByIdAndUserId(milestoneId, userId);

        MilestoneStage stage = new MilestoneStage();
        stage.setMilestoneId(milestoneId);
        stage.setTitle(request.getTitle());
        stage.setTargetDate(request.getTargetDate());
        stage.setSortOrder(request.getSortOrder());

        stageRepository.save(stage);
        return getById(milestoneId, userId);
    }

    @Transactional
    public MilestoneDto updateStage(Long milestoneId, Long stageId, Long userId,
                                     boolean completed) {
        findByIdAndUserId(milestoneId, userId);

        MilestoneStage stage = stageRepository.findById(stageId)
            .filter(s -> s.getMilestoneId().equals(milestoneId))
            .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        stage.setIsCompleted(completed);
        stageRepository.save(stage);

        // 检查是否所有阶段都完成
        if (completed) {
            checkAndUpdateMilestoneStatus(milestoneId, userId);
        }

        return getById(milestoneId, userId);
    }

    @Transactional
    public void deleteStage(Long milestoneId, Long stageId, Long userId) {
        findByIdAndUserId(milestoneId, userId);

        MilestoneStage stage = stageRepository.findById(stageId)
            .filter(s -> s.getMilestoneId().equals(milestoneId))
            .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        stageRepository.delete(stage);
    }

    private Milestone findByIdAndUserId(Long id, Long userId) {
        return milestoneRepository.findById(id)
            .filter(m -> m.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
    }

    private MilestoneDto toDtoWithStages(Milestone milestone) {
        MilestoneDto dto = MilestoneDto.fromEntity(milestone);

        List<MilestoneStageDto> stages = stageRepository
            .findByMilestoneIdOrderBySortOrderAsc(milestone.getId())
            .stream()
            .map(MilestoneStageDto::fromEntity)
            .collect(Collectors.toList());

        dto.setStages(stages);

        // 计算进度
        if (!stages.isEmpty()) {
            long completed = stages.stream().filter(MilestoneStageDto::getIsCompleted).count();
            dto.setProgress((int) (completed * 100 / stages.size()));
        }

        return dto;
    }

    private void checkAndUpdateMilestoneStatus(Long milestoneId, Long userId) {
        List<MilestoneStage> stages = stageRepository.findByMilestoneIdOrderBySortOrderAsc(milestoneId);
        boolean allCompleted = stages.stream().allMatch(MilestoneStage::getIsCompleted);

        if (allCompleted && !stages.isEmpty()) {
            Milestone milestone = milestoneRepository.findById(milestoneId).orElseThrow();
            milestone.setStatus(Milestone.Status.COMPLETED);
            milestoneRepository.save(milestone);
        }
    }
}