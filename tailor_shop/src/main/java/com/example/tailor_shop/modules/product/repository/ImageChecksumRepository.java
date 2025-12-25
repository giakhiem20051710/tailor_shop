package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.ImageChecksumEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageChecksumRepository extends JpaRepository<ImageChecksumEntity, Long> {

    Optional<ImageChecksumEntity> findByChecksum(String checksum);

    List<ImageChecksumEntity> findByChecksumIn(List<String> checksums);
}

