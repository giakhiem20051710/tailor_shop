package com.example.tailor_shop.modules.appointment.repository;

import com.example.tailor_shop.modules.appointment.domain.AppointmentEntity;
import com.example.tailor_shop.modules.appointment.domain.AppointmentStatus;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {

    Page<AppointmentEntity> findByIsDeletedFalse(Pageable pageable);

    @Query("SELECT a FROM AppointmentEntity a WHERE a.isDeleted = false " +
           "AND (:staffId IS NULL OR a.staff.id = :staffId) " +
           "AND (:customerId IS NULL OR a.customer.id = :customerId) " +
           "AND (:date IS NULL OR a.appointmentDate = :date) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:type IS NULL OR a.type = :type)")
    Page<AppointmentEntity> search(@Param("staffId") Long staffId,
                                   @Param("customerId") Long customerId,
                                   @Param("date") LocalDate date,
                                   @Param("status") AppointmentStatus status,
                                   @Param("type") AppointmentType type,
                                   Pageable pageable);

    @Query("SELECT a FROM AppointmentEntity a WHERE a.isDeleted = false " +
           "AND a.staff.id = :staffId " +
           "AND a.appointmentDate = :date " +
           "AND a.status = 'scheduled'")
    List<AppointmentEntity> findByStaffAndDate(@Param("staffId") Long staffId,
                                                 @Param("date") LocalDate date);

    @Query("SELECT a FROM AppointmentEntity a WHERE a.isDeleted = false " +
           "AND a.staff.id = :staffId " +
           "AND a.appointmentDate = :date " +
           "AND a.appointmentTime = :time " +
           "AND a.status = 'scheduled' " +
           "AND (:excludeId IS NULL OR a.id != :excludeId)")
    List<AppointmentEntity> findConflicts(@Param("staffId") Long staffId,
                                          @Param("date") LocalDate date,
                                          @Param("time") LocalTime time,
                                          @Param("excludeId") Long excludeId);
}

