package com.example.tailor_shop.modules.gamification.repository;

import com.example.tailor_shop.modules.gamification.domain.DailyCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyCheckinRepository extends JpaRepository<DailyCheckin, Long> {

    // Check if already checked in today (anti-fraud)
    boolean existsByUserIdAndCheckinDate(Long userId, LocalDate checkinDate);

    Optional<DailyCheckin> findByUserIdAndCheckinDate(Long userId, LocalDate checkinDate);

    // Get check-in history for calendar view
    List<DailyCheckin> findByUserIdAndCheckinDateBetweenOrderByCheckinDateDesc(
            Long userId, LocalDate startDate, LocalDate endDate);
}
