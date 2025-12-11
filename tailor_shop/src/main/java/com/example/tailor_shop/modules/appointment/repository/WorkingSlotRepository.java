package com.example.tailor_shop.modules.appointment.repository;

import com.example.tailor_shop.modules.appointment.domain.WorkingSlotEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

public interface WorkingSlotRepository extends JpaRepository<WorkingSlotEntity, Long> {

    Page<WorkingSlotEntity> findByTailorIdAndIsActiveTrue(Long tailorId, Pageable pageable);

    Page<WorkingSlotEntity> findByIsActiveTrue(Pageable pageable);

    @Query("SELECT w FROM WorkingSlotEntity w WHERE w.tailor.id = :tailorId " +
           "AND w.dayOfWeek = :dayOfWeek " +
           "AND w.isActive = true " +
           "AND (w.effectiveFrom IS NULL OR w.effectiveFrom <= :date) " +
           "AND (w.effectiveTo IS NULL OR w.effectiveTo >= :date)")
    List<WorkingSlotEntity> findActiveByTailorAndDay(@Param("tailorId") Long tailorId,
                                                      @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                                      @Param("date") LocalDate date);

    @Query("SELECT w FROM WorkingSlotEntity w WHERE w.tailor.id = :tailorId " +
           "AND w.dayOfWeek = :dayOfWeek " +
           "AND w.isActive = true " +
           "AND (w.effectiveFrom IS NULL OR w.effectiveFrom <= :date) " +
           "AND (w.effectiveTo IS NULL OR w.effectiveTo >= :date) " +
           "AND (:excludeId IS NULL OR w.id != :excludeId)")
    List<WorkingSlotEntity> findActiveByTailorAndDayExclude(@Param("tailorId") Long tailorId,
                                                             @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                                             @Param("date") LocalDate date,
                                                             @Param("excludeId") Long excludeId);
}

