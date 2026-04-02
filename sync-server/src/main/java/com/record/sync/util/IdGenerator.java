package com.record.sync.util;

import java.util.Random;

/**
 * ID 生成器
 * 格式：{prefix}_{timestamp}_{random}
 */
public class IdGenerator {

    private static final Random RANDOM = new Random();

    /**
     * 生成 ID
     * @param prefix ID 前缀，如 "space", "event", "anniversary"
     */
    public static String generate(String prefix) {
        long timestamp = System.currentTimeMillis();
        String random = Integer.toHexString(RANDOM.nextInt(0xFFFFFF));
        return String.format("%s_%d_%s", prefix, timestamp, random);
    }

    /**
     * 生成设备 ID
     */
    public static String generateDeviceId() {
        return generate("device");
    }

    /**
     * 生成空间 ID
     */
    public static String generateSpaceId() {
        return generate("space");
    }
}
