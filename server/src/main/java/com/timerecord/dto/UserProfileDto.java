package com.timerecord.dto;

import lombok.Data;

@Data
public class UserProfileDto {
    private Long id;
    private String nickname;
    private String avatarUrl;
}