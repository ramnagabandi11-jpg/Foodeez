package com.foodeez.customer.ui.screens.orders

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.foodeez.customer.ui.screens.orders.viewmodel.OrdersViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    navController: NavController,
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Orders") }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Order Status Tabs
            ScrollableTabRow(
                selectedTabIndex = uiState.selectedStatus.ordinal,
                modifier = Modifier.fillMaxWidth()
            ) {
                OrderStatus.values().forEach { status ->
                    Tab(
                        selected = uiState.selectedStatus == status,
                        onClick = { viewModel.selectStatus(status) },
                        text = { Text(status.displayName) }
                    )
                }
            }

            // Orders List
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (uiState.orders.isEmpty()) {
                EmptyOrdersContent(
                    modifier = Modifier.fillMaxSize(),
                    status = uiState.selectedStatus
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.orders) { order ->
                        OrderCard(
                            order = order,
                            onOrderClick = { orderId ->
                                navController.navigate("order_tracking/$orderId")
                            },
                            onReorder = { orderId ->
                                viewModel.reorderOrder(orderId)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun OrderCard(
    order: Order,
    onOrderClick: (String) -> Unit,
    onReorder: (String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOrderClick(order.id) },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = order.restaurantName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = order.items.joinToString(", ") { "${it.name} x${it.quantity}" },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }

                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = "₹${order.total}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = order.formattedDate,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Divider(modifier = Modifier.padding(vertical = 12.dp))

            // Status and Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Status
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = order.status.icon,
                        contentDescription = order.status.displayName,
                        tint = order.status.color,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = order.status.displayName,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = order.status.color
                    )
                }

                // Action Button
                when (order.status) {
                    OrderStatus.DELIVERED -> {
                        OutlinedButton(
                            onClick = { onReorder(order.id) }
                        ) {
                            Text("Reorder")
                        }
                    }
                    OrderStatus.ON_THE_WAY -> {
                        Button(
                            onClick = { onOrderClick(order.id) }
                        ) {
                            Text("Track Order")
                        }
                    }
                    else -> {
                        // No action for other statuses
                    }
                }
            }

            // Progress Bar (for active orders)
            if (order.status.isActive) {
                Column {
                    Spacer(modifier = Modifier.height(12.dp))
                    LinearProgressIndicator(
                        progress = order.status.progress,
                        modifier = Modifier.fillMaxWidth(),
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = order.status.progressMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyOrdersContent(
    modifier: Modifier = Modifier,
    status: OrderStatus
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Receipt,
                contentDescription = "No orders",
                modifier = Modifier.size(80.dp),
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Text(
                text = if (status == OrderStatus.ALL) "No orders yet" else "No ${status.displayName.lowercase()} orders",
                style = MaterialTheme.typography.headlineSmall
            )
            if (status == OrderStatus.ALL) {
                Text(
                    text = "Your order history will appear here",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Button(
                    onClick = { /* Navigate to restaurants */ }
                ) {
                    Text("Order Food Now")
                }
            }
        }
    }
}

// Data classes for orders
enum class OrderStatus(val displayName: String, val icon: androidx.compose.ui.graphics.vector.ImageVector, val color: androidx.compose.ui.graphics.Color, val progress: Float, val progressMessage: String, val isActive: Boolean) {
    ALL("All", Icons.Default.List, MaterialTheme.colorScheme.onSurface, 0f, "", false),
    ACTIVE("Active", Icons.Default.Clock, MaterialTheme.colorScheme.primary, 0.6f, "Preparing", true),
    COMPLETED("Completed", Icons.Default.CheckCircle, MaterialTheme.colorScheme.primary, 1f, "Delivered", false),
    CANCELLED("Cancelled", Icons.Default.Cancel, MaterialTheme.colorScheme.error, 0f, "Cancelled", false),

    // Detailed statuses
    PLACED("Order Placed", Icons.Default.Receipt, MaterialTheme.colorScheme.primary, 0.2f, "Order confirmed", true),
    CONFIRMED("Confirmed", Icons.Default.CheckCircle, MaterialTheme.colorScheme.primary, 0.3f, "Restaurant preparing", true),
    PREPARING("Preparing", Icons.Default.Restaurant, MaterialTheme.colorScheme.primary, 0.6f, "Food being prepared", true),
    ON_THE_WAY("On the way", Icons.Default.LocalShipping, MaterialTheme.colorScheme.primary, 0.8f, "Delivery partner assigned", true),
    DELIVERED("Delivered", Icons.Default.CheckCircle, MaterialTheme.colorScheme.primary, 1f, "Order delivered", false)
}

data class Order(
    val id: String,
    val restaurantName: String,
    val items: List<OrderItem>,
    val total: Double,
    val status: OrderStatus,
    val orderDate: String,
    val estimatedDeliveryTime: String? = null
) {
    val formattedDate: String
        get() = orderDate // Add date formatting logic
}

data class OrderItem(
    val name: String,
    val quantity: Int,
    val price: Double
)