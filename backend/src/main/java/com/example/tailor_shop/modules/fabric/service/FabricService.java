package com.example.tailor_shop.modules.fabric.service;

import com.example.tailor_shop.modules.fabric.dto.ApplyFabricPromoRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricFilterRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricHoldRequestRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricHoldRequestResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricInventoryRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricInventoryResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricOrderResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricResponse;
import com.example.tailor_shop.modules.fabric.dto.UpdateHoldRequestStatusRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface cho Fabric module
 */
public interface FabricService {

    /**
     * List fabrics với filter
     */
    Page<FabricResponse> list(FabricFilterRequest filter, Pageable pageable);

    /**
     * Get fabric detail
     */
    FabricResponse detail(Long id);

    /**
     * Get fabric detail by code
     */
    FabricResponse detailByCode(String code);

    /**
     * Get fabric detail by slug
     */
    FabricResponse detailBySlug(String slug);

    /**
     * Create fabric
     */
    FabricResponse create(FabricRequest request, Long createdBy);

    /**
     * Update fabric
     */
    FabricResponse update(Long id, FabricRequest request);

    /**
     * Delete fabric (soft delete)
     */
    void delete(Long id);

    /**
     * Increment view count
     */
    void incrementViewCount(Long id);

    /**
     * Get fabric inventory
     */
    Page<FabricInventoryResponse> getInventory(Long fabricId, Pageable pageable);

    /**
     * Update fabric inventory
     */
    FabricInventoryResponse updateInventory(Long fabricId, FabricInventoryRequest request);

    /**
     * Create hold/visit request
     */
    FabricHoldRequestResponse createHoldRequest(FabricHoldRequestRequest request, Long userId);

    /**
     * List hold/visit requests
     */
    Page<FabricHoldRequestResponse> listHoldRequests(
            Long fabricId, Long userId, Pageable pageable
    );

    /**
     * Get hold request detail
     */
    FabricHoldRequestResponse getHoldRequestDetail(Long id);

    /**
     * Update hold request status (staff/admin only)
     */
    FabricHoldRequestResponse updateHoldRequestStatus(
            Long id, UpdateHoldRequestStatusRequest request, Long handledBy
    );

    /**
     * Cancel hold request (customer only)
     */
    void cancelHoldRequest(Long id, Long userId);

    /**
     * Apply promo code khi mua fabric
     */
    FabricOrderResponse applyPromoCode(ApplyFabricPromoRequest request, Long userId);
}

