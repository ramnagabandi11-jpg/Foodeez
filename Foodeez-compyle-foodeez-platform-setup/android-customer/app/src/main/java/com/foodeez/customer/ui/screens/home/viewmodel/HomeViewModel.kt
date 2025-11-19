package com.foodeez.customer.ui.screens.home.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.foodeez.customer.domain.model.Category
import com.foodeez.customer.domain.model.Restaurant
import com.foodeez.customer.domain.usecase.GetCategoriesUseCase
import com.foodeez.customer.domain.usecase.GetPopularRestaurantsUseCase
import com.foodeez.customer.domain.usecase.UpdateLocationUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = false,
    val categories: List<Category> = emptyList(),
    val popularRestaurants: List<Restaurant> = emptyList(),
    val selectedLocation: String = "Current Location",
    val searchQuery: String = "",
    val notificationCount: Int = 0,
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getCategoriesUseCase: GetCategoriesUseCase,
    private val getPopularRestaurantsUseCase: GetPopularRestaurantsUseCase,
    private val updateLocationUseCase: UpdateLocationUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    private fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            try {
                // Load categories
                val categories = getCategoriesUseCase()

                // Load popular restaurants
                val restaurants = getPopularRestaurantsUseCase()

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    categories = categories,
                    popularRestaurants = restaurants
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun search(query: String) {
        // Handle search
    }

    fun updateLocation(location: String) {
        viewModelScope.launch {
            try {
                updateLocationUseCase(location)
                _uiState.value = _uiState.value.copy(selectedLocation = location)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}