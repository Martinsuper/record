package com.timerecord.service;

import com.timerecord.dto.AnniversaryCreateRequest;
import com.timerecord.dto.AnniversaryDto;
import com.timerecord.entity.Anniversary;
import com.timerecord.exception.ResourceNotFoundException;
import com.timerecord.repository.AnniversaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnniversaryService {

    private final AnniversaryRepository repository;

    public List<AnniversaryDto> getAllByUser(Long userId) {
        return repository.findByUserIdOrderByIsPinnedDescEventDateAsc(userId)
            .stream()
            .map(AnniversaryDto::fromEntity)
            .collect(Collectors.toList());
    }

    public List<AnniversaryDto> getByCategory(Long userId, String category) {
        return repository.findByUserIdAndCategory(userId, category)
            .stream()
            .map(AnniversaryDto::fromEntity)
            .collect(Collectors.toList());
    }

    public AnniversaryDto getById(Long id, Long userId) {
        Anniversary anniversary = repository.findById(id)
            .filter(a -> a.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Anniversary not found"));
        return AnniversaryDto.fromEntity(anniversary);
    }

    public List<AnniversaryDto> getUpcoming(Long userId, int days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);

        return getAllByUser(userId).stream()
            .filter(a -> a.getDaysRemaining() >= 0 && a.getDaysRemaining() <= days)
            .collect(Collectors.toList());
    }

    @Transactional
    public AnniversaryDto create(Long userId, AnniversaryCreateRequest request) {
        Anniversary anniversary = new Anniversary();
        anniversary.setUserId(userId);
        anniversary.setTitle(request.getTitle());
        anniversary.setEventDate(request.getEventDate());
        anniversary.setRepeatType(request.getRepeatType());
        anniversary.setCategory(request.getCategory());
        anniversary.setIcon(request.getIcon());
        anniversary.setBackgroundImage(request.getBackgroundImage());
        anniversary.setRemindDays(request.getRemindDays());
        anniversary.setIsPinned(request.getIsPinned());

        return AnniversaryDto.fromEntity(repository.save(anniversary));
    }

    @Transactional
    public AnniversaryDto update(Long id, Long userId, AnniversaryCreateRequest request) {
        Anniversary anniversary = repository.findById(id)
            .filter(a -> a.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Anniversary not found"));

        anniversary.setTitle(request.getTitle());
        anniversary.setEventDate(request.getEventDate());
        anniversary.setRepeatType(request.getRepeatType());
        anniversary.setCategory(request.getCategory());
        anniversary.setIcon(request.getIcon());
        anniversary.setBackgroundImage(request.getBackgroundImage());
        anniversary.setRemindDays(request.getRemindDays());
        anniversary.setIsPinned(request.getIsPinned());

        return AnniversaryDto.fromEntity(repository.save(anniversary));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Anniversary anniversary = repository.findById(id)
            .filter(a -> a.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Anniversary not found"));
        repository.delete(anniversary);
    }
}