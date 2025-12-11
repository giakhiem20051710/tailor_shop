package com.example.tailor_shop.modules.measurement.service;

import com.example.tailor_shop.modules.measurement.dto.MeasurementRequest;
import com.example.tailor_shop.modules.measurement.dto.MeasurementResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MeasurementService {

    Page<MeasurementResponse> list(Long customerId, Long orderId, Long currentUserId, boolean isCustomer, Pageable pageable);

    MeasurementResponse detail(Long id, Long currentUserId, boolean isCustomer);

    MeasurementResponse create(MeasurementRequest request, Long currentUserId);

    MeasurementResponse update(Long id, MeasurementRequest request, Long currentUserId);

    List<MeasurementResponse> history(Long id, Long currentUserId, boolean isCustomer);

    MeasurementResponse latest(Long id, Long currentUserId, boolean isCustomer);
}

