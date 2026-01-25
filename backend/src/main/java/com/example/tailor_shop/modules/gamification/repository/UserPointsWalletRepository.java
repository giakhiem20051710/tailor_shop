package com.example.tailor_shop.modules.gamification.repository;

import com.example.tailor_shop.modules.gamification.domain.UserPointsWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPointsWalletRepository extends JpaRepository<UserPointsWallet, Long> {

    Optional<UserPointsWallet> findByUserId(Long userId);

    @Modifying
    @Query("UPDATE UserPointsWallet w SET w.balance = w.balance + :amount, w.totalEarned = w.totalEarned + :amount WHERE w.userId = :userId")
    int addPoints(@Param("userId") Long userId, @Param("amount") int amount);

    @Modifying
    @Query("UPDATE UserPointsWallet w SET w.balance = w.balance - :amount, w.totalSpent = w.totalSpent + :amount WHERE w.userId = :userId AND w.balance >= :amount")
    int spendPoints(@Param("userId") Long userId, @Param("amount") int amount);
}
