package com.example.tailor_shop.modules.favorite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho check favorite status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteCheckResponse {

    private Boolean isFavorite;
}

