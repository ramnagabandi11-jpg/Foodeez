package com.foodeez.customer.domain.model

data class Restaurant(
    val id: String,
    val name: String,
    val cuisine: String,
    val rating: Double,
    val reviewCount: Int,
    val deliveryTime: Int, // in minutes
    val deliveryFee: Double,
    val minOrderAmount: Double,
    val imageUrl: String,
    val isPromoted: Boolean = false,
    val isAvailable: Boolean = true,
    val distance: Double = 0.0, // in km
    val address: String = "",
    val phone: String = "",
    val tags: List<String> = emptyList()
)

data class RestaurantMenuItem(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val category: String,
    val imageUrl: String,
    val isVegetarian: Boolean,
    val isPopular: Boolean = false,
    val customizationOptions: List<CustomizationOption> = emptyList()
)

data class CustomizationOption(
    val id: String,
    val name: String,
    val type: CustomizationType,
    val options: List<CustomizationChoice>,
    val minSelections: Int = 0,
    val maxSelections: Int = 1
)

enum class CustomizationType {
    SINGLE_CHOICE, // Radio button
    MULTIPLE_CHOICE, // Checkbox
    QUANTITY // Add/remove items
}

data class CustomizationChoice(
    val id: String,
    val name: String,
    val price: Double,
    val isDefault: Boolean = false
)