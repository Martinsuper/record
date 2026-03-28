package com.timerecord.service;

import com.timerecord.dto.UserProfileDto;
import com.timerecord.entity.User;
import com.timerecord.exception.ResourceNotFoundException;
import com.timerecord.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findByOpenid(String openid) {
        return userRepository.findByOpenid(openid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User createOrGetUser(String openid) {
        return userRepository.findByOpenid(openid)
            .orElseGet(() -> {
                User user = new User();
                user.setOpenid(openid);
                return userRepository.save(user);
            });
    }

    @Transactional
    public User updateProfile(Long userId, UserProfileDto profile) {
        User user = findById(userId);
        if (profile.getNickname() != null) {
            user.setNickname(profile.getNickname());
        }
        if (profile.getAvatarUrl() != null) {
            user.setAvatarUrl(profile.getAvatarUrl());
        }
        return userRepository.save(user);
    }
}