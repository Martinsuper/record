package com.record.sync.util;

import java.util.Random;

/**
 * 共享码生成器
 * 生成 6 位字母数字组合，排除歧义字符（0/O, 1/I/l）
 */
public class ShareCodeGenerator {

    // 可用字符：排除 0, O, 1, I, l
    private static final char[] ALLOWED_CHARS = {
        '2', '3', '4', '5', '6', '7', '8', '9',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
        'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    };

    private static final int CODE_LENGTH = 6;
    private static final Random RANDOM = new Random();

    /**
     * 生成一个共享码
     */
    public static String generate() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(ALLOWED_CHARS[RANDOM.nextInt(ALLOWED_CHARS.length)]);
        }
        return code.toString();
    }
}
