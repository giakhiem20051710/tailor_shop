package com.myhien.tailor.modules.test.controller;

import com.myhien.tailor.config.exception.*;
import com.myhien.tailor.modules.order.dto.OrderRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

/**
 * Controller để test các loại exception
 * Chỉ dùng trong development, không deploy production
 */
@RestController
@RequestMapping("/test/exceptions")
public class TestExceptionController {
    
    /**
     * Test BadRequestException
     * GET /test/exceptions/bad-request
     */
    @GetMapping("/bad-request")
    public void testBadRequest() {
        throw new BadRequestException("This is a test BadRequestException");
    }
    
    /**
     * Test BusinessException
     * GET /test/exceptions/business
     */
    @GetMapping("/business")
    public void testBusiness() {
        throw new BusinessException("TEST_ERROR", "This is a test BusinessException");
    }
    
    /**
     * Test UnauthorizedException
     * GET /test/exceptions/unauthorized
     */
    @GetMapping("/unauthorized")
    public void testUnauthorized() {
        throw new UnauthorizedException("This is a test UnauthorizedException");
    }
    
    /**
     * Test NotFoundException
     * GET /test/exceptions/not-found
     */
    @GetMapping("/not-found")
    public void testNotFound() {
        throw new NotFoundException("This is a test NotFoundException");
    }
    
    /**
     * Test ResourceNotFoundException
     * GET /test/exceptions/resource-not-found
     */
    @GetMapping("/resource-not-found")
    public void testResourceNotFound() {
        throw new ResourceNotFoundException("This is a test ResourceNotFoundException");
    }
    
    /**
     * Test ConstraintViolationException (validation trên @RequestParam)
     * GET /test/exceptions/validation?name=  (thiếu name hoặc name rỗng)
     */
    @GetMapping("/validation")
    public void testValidation(
        @Valid @RequestParam @NotNull(message = "Name is required") String name
    ) {
        // Nếu không có param name → ConstraintViolationException
    }
    
    /**
     * Test MethodArgumentNotValidException (validation trên DTO)
     * POST /test/exceptions/dto-validation
     * Body: { "customerId": null, "total": -100 }
     */
    @PostMapping("/dto-validation")
    public void testDtoValidation(@RequestBody @Valid OrderRequestDTO dto) {
        // Nếu dto có field null hoặc invalid → MethodArgumentNotValidException
    }
    
    /**
     * Test MethodArgumentTypeMismatchException
     * GET /test/exceptions/type-mismatch/abc
     * (id phải là Long nhưng gửi "abc")
     */
    @GetMapping("/type-mismatch/{id}")
    public void testTypeMismatch(@PathVariable Long id) {
        // Nếu gửi "abc" thay vì số → MethodArgumentTypeMismatchException
    }
    
    /**
     * Test HttpMessageNotReadableException (malformed JSON)
     * POST /test/exceptions/malformed-json
     * Body: { "name": "test", "total": }  (JSON sai format)
     */
    @PostMapping("/malformed-json")
    public void testMalformedJson(@RequestBody OrderRequestDTO dto) {
        // Nếu JSON sai format → HttpMessageNotReadableException
    }
    
    /**
     * Test Generic Exception (500)
     * GET /test/exceptions/generic
     */
    @GetMapping("/generic")
    public void testGeneric() {
        throw new RuntimeException("This is a test generic exception");
    }
    
    /**
     * Test CsvBatchException
     * GET /test/exceptions/csv-batch
     */
    @GetMapping("/csv-batch")
    public void testCsvBatch() {
        throw new CsvBatchException("CSV processing failed", 
            java.util.List.of("Error 1", "Error 2", "Error 3"));
    }
}

