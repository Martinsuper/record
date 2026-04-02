package com.record.sync.exception;

public class ShareCodeNotFoundException extends RuntimeException {

    public ShareCodeNotFoundException(String shareCode) {
        super("Share code not found: " + shareCode);
    }
}