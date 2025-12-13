package com.example.tailor_shop.modules.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho reply review (shop reply)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyReviewRequest {

    @NotBlank(message = "Reply text is required")
    @Size(max = 2000, message = "Reply must not exceed 2000 characters")
    private String replyText;
}

