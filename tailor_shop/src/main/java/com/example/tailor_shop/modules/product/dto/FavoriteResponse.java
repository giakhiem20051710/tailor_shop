package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteResponse {

    private Long id;
    private String productKey;
    private ProductListItemResponse product;
    private OffsetDateTime addedAt;
}

