package com.example.tailor_shop.modules.gamification.repository;

import com.example.tailor_shop.modules.gamification.domain.UserCheckinStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCheckinStreakRepository extends JpaRepository<UserCheckinStreak, Long> {

    Optional<UserCheckinStreak> findByUserId(Long userId);
}
