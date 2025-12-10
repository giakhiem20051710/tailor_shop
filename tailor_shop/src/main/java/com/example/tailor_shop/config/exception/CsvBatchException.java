package com.example.tailor_shop.config.exception;

import java.util.List;

public class CsvBatchException extends RuntimeException {

    private final List<Object> errors;

    public CsvBatchException(String message, List<Object> errors) {
        super(message);
        this.errors = errors;
    }

    public List<Object> getErrors() {
        return errors;
    }
}
