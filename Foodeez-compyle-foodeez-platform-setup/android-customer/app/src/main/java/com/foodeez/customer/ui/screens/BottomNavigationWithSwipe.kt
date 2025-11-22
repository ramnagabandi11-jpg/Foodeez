package com.foodeez.customer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.foodeez.customer.ui.navigation.Screen
import com.foodeez.customer.ui.screens.cart.CartScreen
import com.foodeez.customer.ui.screens.home.HomeScreen
import com.foodeez.customer.ui.screens.orders.OrdersScreen
import com.foodeez.customer.ui.screens.profile.ProfileScreen
import com.foodeez.customer.ui.screens.search.SearchScreen
import com.google.accompanist.pager.HorizontalPager
import com.google.accompanist.pager.rememberPagerState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomNavigationWithSwipe() {
    val bottomNavController = rememberNavController()
    val pagerState = rememberPagerState(pageCount = { 5 })

    // Sync pager with navigation
    val navBackStackEntry by bottomNavController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val currentPage = when (currentRoute) {
        Screen.Home.route -> 0
        Screen.Search.route -> 1
        Screen.Cart.route -> 2
        Screen.Orders.route -> 3
        Screen.Profile.route -> 4
        else -> 0
    }

    LaunchedEffect(currentPage) {
        if (currentPage != pagerState.currentPage) {
            pagerState.animateScrollToPage(currentPage)
        }
    }

    LaunchedEffect(pagerState.currentPage) {
        val newRoute = when (pagerState.currentPage) {
            0 -> Screen.Home.route
            1 -> Screen.Search.route
            2 -> Screen.Cart.route
            3 -> Screen.Orders.route
            4 -> Screen.Profile.route
            else -> Screen.Home.route
        }

        if (currentRoute != newRoute) {
            bottomNavController.navigate(newRoute) {
                popUpTo(bottomNavController.graph.startDestinationId)
                launchSingleTop = true
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Main Content with Swipe
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
            userScrollEnabled = true
        ) { page ->
            Box(modifier = Modifier.fillMaxSize()) {
                when (page) {
                    0 -> HomeScreen(bottomNavController)
                    1 -> SearchScreen(bottomNavController)
                    2 -> CartScreen(bottomNavController)
                    3 -> OrdersScreen(bottomNavController)
                    4 -> ProfileScreen(bottomNavController)
                }
            }
        }

        // Bottom Navigation
        BottomNavigationBar(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth(),
            navController = bottomNavController
        )
    }
}

@Composable
fun BottomNavigationBar(
    modifier: Modifier = Modifier,
    navController: NavController
) {
    val items = listOf(
        BottomNavItem(
            name = "Home",
            route = Screen.Home.route,
            icon = Icons.Default.Home
        ),
        BottomNavItem(
            name = "Search",
            route = Screen.Search.route,
            icon = Icons.Default.Search
        ),
        BottomNavItem(
            name = "Cart",
            route = Screen.Cart.route,
            icon = Icons.Default.ShoppingCart
        ),
        BottomNavItem(
            name = "Orders",
            route = Screen.Orders.route,
            icon = Icons.Default.Receipt
        ),
        BottomNavItem(
            name = "Profile",
            route = Screen.Profile.route,
            icon = Icons.Default.Person
        )
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Surface(
        modifier = modifier,
        shadowElevation = 8.dp
    ) {
        NavigationBar {
            items.forEach { item ->
                NavigationBarItem(
                    icon = {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.name,
                            modifier = Modifier.size(24.dp)
                        )
                    },
                    label = {
                        Text(
                            text = item.name,
                            style = MaterialTheme.typography.labelSmall
                        )
                    },
                    selected = currentRoute == item.route,
                    onClick = {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.startDestinationId)
                            launchSingleTop = true
                        }
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MaterialTheme.colorScheme.onPrimary,
                        selectedTextColor = MaterialTheme.colorScheme.onPrimary,
                        selectedIndicatorColor = MaterialTheme.colorScheme.primary,
                        unselectedIconColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        unselectedTextColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                )
            }
        }
    }
}

data class BottomNavItem(
    val name: String,
    val route: String,
    val icon: ImageVector
)