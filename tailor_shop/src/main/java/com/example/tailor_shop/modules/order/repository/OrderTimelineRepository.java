package com.example.tailor_shop.modules.order.repository;

import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.domain.OrderTimelineEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderTimelineRepository extends JpaRepository<OrderTimelineEntity, Long> {
    List<OrderTimelineEntity> findByOrderOrderByCreatedAtAsc(OrderEntity order);
}

