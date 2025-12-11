# 📋 Module Template - Copy & Paste

## 🎯 Template Hoàn Chỉnh Cho Module Mới

Copy template này và thay `ModuleName` bằng tên module của bạn.

---

## 1. Entity

```java
package com.myhien.tailor.modules.modulename.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "module_name")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ModuleEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Copy fields từ database schema
    @Column(nullable = false, length = 100)
    private String name;
    
    // Relationships nếu có
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_id")
    private RelatedEntity related;
    
    // Soft delete
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    // Timestamps
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
    
    @PreUpdate
    void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
```

---

## 2. Repository

```java
package com.myhien.tailor.modules.modulename.repository;

import com.myhien.tailor.modules.modulename.domain.ModuleEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
    
    Optional<ModuleEntity> findByCode(String code);
    
    boolean existsByCode(String code);
    
    Page<ModuleEntity> findByIsDeletedFalse(Pageable pageable);
    
    // Custom queries nếu cần
    // @Query("SELECT m FROM ModuleEntity m WHERE ...")
    // List<ModuleEntity> findCustom(...);
}
```

---

## 3. DTOs

### RequestDTO
```java
package com.myhien.tailor.modules.modulename.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ModuleRequestDTO(
    @NotNull(message = "Field is required")
    Long fieldId,
    
    @NotBlank(message = "Name is required")
    @Size(max = 100)
    String name,
    
    @Positive
    BigDecimal amount,
    
    LocalDate date
) {}
```

### ResponseDTO
```java
package com.myhien.tailor.modules.modulename.dto;

import java.time.OffsetDateTime;

public record ModuleResponseDTO(
    Long id,
    String code,
    String name,
    BigDecimal amount,
    LocalDate date,
    Long relatedId,
    String relatedName,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
```

---

## 4. Service Interface

```java
package com.myhien.tailor.modules.modulename.service;

import com.myhien.tailor.modules.modulename.dto.ModuleRequestDTO;
import com.myhien.tailor.modules.modulename.dto.ModuleResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ModuleService {
    
    ModuleResponseDTO create(ModuleRequestDTO request);
    
    ModuleResponseDTO update(Long id, ModuleRequestDTO request);
    
    ModuleResponseDTO findById(Long id);
    
    ModuleResponseDTO findByCode(String code);
    
    Page<ModuleResponseDTO> findAll(Pageable pageable);
    
    void delete(Long id);
}
```

---

## 5. Service Implementation

```java
package com.myhien.tailor.modules.modulename.service.impl;

import com.myhien.tailor.config.exception.BusinessException;
import com.myhien.tailor.modules.modulename.domain.ModuleEntity;
import com.myhien.tailor.modules.modulename.dto.ModuleRequestDTO;
import com.myhien.tailor.modules.modulename.dto.ModuleResponseDTO;
import com.myhien.tailor.modules.modulename.repository.ModuleRepository;
import com.myhien.tailor.modules.modulename.service.ModuleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class ModuleServiceImpl implements ModuleService {
    
    private final ModuleRepository moduleRepository;
    
    public ModuleServiceImpl(ModuleRepository moduleRepository) {
        this.moduleRepository = moduleRepository;
    }
    
    @Override
    public ModuleResponseDTO create(ModuleRequestDTO request) {
        // Validation
        if (moduleRepository.existsByCode(generateCode())) {
            throw new BusinessException("CODE_EXISTS", "Code already exists");
        }
        
        // Create entity
        ModuleEntity entity = new ModuleEntity();
        entity.setName(request.name());
        entity.setCode(generateCode());
        // ... set other fields
        
        ModuleEntity saved = moduleRepository.save(entity);
        return toResponseDTO(saved);
    }
    
    @Override
    public ModuleResponseDTO update(Long id, ModuleRequestDTO request) {
        ModuleEntity entity = moduleRepository.findById(id)
            .orElseThrow(() -> new BusinessException("MODULE_NOT_FOUND", "Module not found"));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException("MODULE_DELETED", "Module has been deleted");
        }
        
        // Update fields
        entity.setName(request.name());
        // ... update other fields
        
        ModuleEntity saved = moduleRepository.save(entity);
        return toResponseDTO(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ModuleResponseDTO findById(Long id) {
        ModuleEntity entity = moduleRepository.findById(id)
            .orElseThrow(() -> new BusinessException("MODULE_NOT_FOUND", "Module not found"));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException("MODULE_DELETED", "Module has been deleted");
        }
        
        return toResponseDTO(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ModuleResponseDTO findByCode(String code) {
        ModuleEntity entity = moduleRepository.findByCode(code)
            .orElseThrow(() -> new BusinessException("MODULE_NOT_FOUND", "Module not found"));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException("MODULE_DELETED", "Module has been deleted");
        }
        
        return toResponseDTO(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<ModuleResponseDTO> findAll(Pageable pageable) {
        return moduleRepository.findByIsDeletedFalse(pageable)
            .map(this::toResponseDTO);
    }
    
    @Override
    public void delete(Long id) {
        ModuleEntity entity = moduleRepository.findById(id)
            .orElseThrow(() -> new BusinessException("MODULE_NOT_FOUND", "Module not found"));
        
        entity.setIsDeleted(true);
        moduleRepository.save(entity);
    }
    
    private String generateCode() {
        String code;
        do {
            code = "MOD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (moduleRepository.existsByCode(code));
        return code;
    }
    
    private ModuleResponseDTO toResponseDTO(ModuleEntity entity) {
        return new ModuleResponseDTO(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            // ... other fields
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
```

---

## 6. Controller

```java
package com.myhien.tailor.modules.modulename.controller;

import com.myhien.tailor.modules.modulename.dto.ModuleRequestDTO;
import com.myhien.tailor.modules.modulename.dto.ModuleResponseDTO;
import com.myhien.tailor.modules.modulename.service.ModuleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/modules")
public class ModuleController {
    
    private final ModuleService moduleService;
    
    public ModuleController(ModuleService moduleService) {
        this.moduleService = moduleService;
    }
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ModuleResponseDTO create(@RequestBody @Valid ModuleRequestDTO request) {
        return moduleService.create(request);
    }
    
    @PutMapping("/{id}")
    public ModuleResponseDTO update(
        @PathVariable Long id,
        @RequestBody @Valid ModuleRequestDTO request
    ) {
        return moduleService.update(id, request);
    }
    
    @GetMapping("/{id}")
    public ModuleResponseDTO findById(@PathVariable Long id) {
        return moduleService.findById(id);
    }
    
    @GetMapping("/code/{code}")
    public ModuleResponseDTO findByCode(@PathVariable String code) {
        return moduleService.findByCode(code);
    }
    
    @GetMapping
    public Page<ModuleResponseDTO> findAll(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return moduleService.findAll(pageable);
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        moduleService.delete(id);
    }
}
```

---

## 7. Checklist

Sau khi copy template:

- [ ] Thay `ModuleName` → Tên module thực tế
- [ ] Thay `module_name` → Tên table trong database
- [ ] Copy fields từ database schema vào Entity
- [ ] Thêm relationships nếu có
- [ ] Customize DTOs theo nhu cầu
- [ ] Thêm business logic vào Service
- [ ] Test với Postman
- [ ] Verify response format

---

## 🚀 Quick Start

1. Copy Entity template → Tạo file mới
2. Copy Repository template → Tạo file mới
3. Copy DTOs template → Tạo file mới
4. Copy Service template → Tạo file mới
5. Copy Controller template → Tạo file mới
6. Thay tên và customize
7. Test!

**Thời gian: ~30 phút/module** ⏰

