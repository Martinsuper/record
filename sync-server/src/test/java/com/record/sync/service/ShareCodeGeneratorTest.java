package com.record.sync.service;

import com.record.sync.util.ShareCodeGenerator;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ShareCodeGeneratorTest {

    @Test
    void generate_shouldReturn6CharCode() {
        String code = ShareCodeGenerator.generate();
        assertEquals(6, code.length());
    }

    @Test
    void generate_shouldNotContainAmbiguousChars() {
        String ambiguousChars = "0O1Il";
        for (int i = 0; i < 100; i++) {
            String code = ShareCodeGenerator.generate();
            for (char c : ambiguousChars.toCharArray()) {
                assertFalse(code.contains(String.valueOf(c)),
                        "Code " + code + " contains ambiguous char " + c);
            }
        }
    }

    @Test
    void generate_shouldGenerateDifferentCodes() {
        String code1 = ShareCodeGenerator.generate();
        String code2 = ShareCodeGenerator.generate();
        assertNotNull(code1);
        assertNotNull(code2);
    }
}