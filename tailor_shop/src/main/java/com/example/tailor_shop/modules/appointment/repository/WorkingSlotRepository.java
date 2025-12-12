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

    Page<WorkingSlotEntity> findByStaffIdAndIsActiveTrue(Long staffId, Pageable pageable);

    Page<WorkingSlotEntity> findByIsActiveTrue(Pageable pageable);

    @Query("SELECT w FROM WorkingSlotEntity w WHERE w.staff.id = :staffId " +
           "AND w.dayOfWeek = :dayOfWeek " +
           "AND w.isActive = true " +
           "AND (w.effectiveFrom IS NULL OR w.effectiveFrom <= :date) " +
           "AND (w.effectiveTo IS NULL OR w.effectiveTo >= :date)")
    List<WorkingSlotEntity> findActiveByStaffAndDay(@Param("staffId") Long staffId,
                                                      @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                                      @Param("date") LocalDate date);

    @Query("SELECT w FROM WorkingSlotEntity w WHERE w.staff.id = :staffId " +
           "AND w.dayOfWeek = :dayOfWeek " +
           "AND w.isActive = true " +
           "AND (w.effectiveFrom IS NULL OR w.effectiveFrom <= :date) " +
           "AND (w.effectiveTo IS NULL OR w.effectiveTo >= :date) " +
           "AND (:excludeId IS NULL OR w.id != :excludeId)")
    List<WorkingSlotEntity> findActiveByStaffAndDayExclude(@Param("staffId") Long staffId,
                                                             @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                                             @Param("date") LocalDate date,
                                                             @Param("excludeId") Long excludeId);

    // Tìm working slots đóng cửa (isActive = false) cho một ngày cụ thể
    @Query("SELECT w FROM WorkingSlotEntity w WHERE w.staff.id = :staffId " +
           "AND w.dayOfWeek = :dayOfWeek " +
           "AND w.isActive = false " +
           "AND (w.effectiveFrom IS NULL OR w.effectiveFrom <= :date) " +
           "AND (w.effectiveTo IS NULL OR w.effectiveTo >= :date)")
    List<WorkingSlotEntity> findClosedByStaffAndDay(@Param("staffId") Long staffId,
                                                      @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                                      @Param("date") LocalDate date);

    // Tìm tất cả working slots đóng cửa trong khoảng thời gian
    @Query("SELECT w FROM WorkingSlotEntity w WHERE w.staff.id = :staffId " +
           "AND w.isActive = false " +
           "AND ((w.effectiveFrom IS NULL AND w.effectiveTo IS NULL) OR " +
           "     (w.effectiveFrom IS NULL AND w.effectiveTo >= :date) OR " +
           "     (w.effectiveFrom <= :date AND w.effectiveTo IS NULL) OR " +
           "     (w.effectiveFrom <= :date AND w.effectiveTo >= :date))")
    List<WorkingSlotEntity> findClosedInDateRange(@Param("staffId") Long staffId,
                                                    @Param("date") LocalDate date);
}

