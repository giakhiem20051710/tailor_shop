package com.example.tailor_shop.modules.fabric.service;

import com.example.tailor_shop.modules.fabric.dto.FabricAIAnalysisRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricAIAnalysisResponse;

/**
 * Service interface for AI-powered fabric image analysis
 */
public interface FabricAIService {

    /**
     * Analyze a fabric image using AI vision model
     * 
     * @param request Contains the base64 encoded image data
     * @return Analysis result with suggested fabric details
     */
    FabricAIAnalysisResponse analyzeImage(FabricAIAnalysisRequest request);
}
