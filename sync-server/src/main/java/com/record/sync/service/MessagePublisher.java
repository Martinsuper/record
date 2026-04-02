package com.record.sync.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessagePublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CHANNEL_PREFIX = "space:";

    /**
     * 发布消息到指定空间的 channel
     * @param spaceId 空间 ID
     * @param message 消息内容
     */
    public void publish(String spaceId, Object message) {
        String channel = CHANNEL_PREFIX + spaceId;
        redisTemplate.convertAndSend(channel, message);
        log.debug("Published message to channel: {}", channel);
    }
}