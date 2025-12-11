package com.myhien.tailor.config.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class CsvBatchException extends RuntimeException {
    
    private final List<Object> errors;
    
    public CsvBatchException(String message, List<Object> errors) {
        super(message);
        this.errors = errors;
    }
}

