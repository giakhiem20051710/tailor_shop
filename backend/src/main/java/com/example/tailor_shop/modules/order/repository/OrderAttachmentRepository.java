package com.example.tailor_shop.modules.order.repository;

import com.example.tailor_shop.modules.order.domain.OrderAttachmentEntity;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderAttachmentRepository extends JpaRepository<OrderAttachmentEntity, Long> {
    List<OrderAttachmentEntity> findByOrder(OrderEntity order);
}

