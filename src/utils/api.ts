/**
 * API client for interacting with the backend REST API
 */

import { Order } from "@/hooks/use-cart";
import { Product } from "@/data/products";

// Base API URL - change this to your actual API URL when deployed
const API_URL = "http://192.168.1.3:8000";

// Products collection ga reference olish
const PRODUCTS_COLLECTION = "products";

/**
 * Fetch all products from the API
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", errorText);
      throw new Error(`Error fetching products: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProduct(id: string): Promise<Product> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Error fetching product: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new product
 */
export async function createProduct(productData: Omit<Product, "id">): Promise<Product> {
  if (!productData.name || !productData.price || !productData.category) {
    throw new Error('Missing required fields');
  }

  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: productData.name,
        price: Number(productData.price),
        category: productData.category,
        image: productData.image || ''
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const newProduct = await response.json();
    
    if (!newProduct) {
      throw new Error('Server returned empty response');
    }
    
    return newProduct;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, productData: FormData): Promise<Product> {
  try {
    console.log(`Updating product ${id} with data:`, Object.fromEntries(productData.entries()));
    
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      body: productData, // FormData for multipart/form-data (supports file uploads)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Server error response:", errorData);
      throw new Error(`Error updating product: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting product: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

/**
 * Fetch all orders
 */
export async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${API_URL}/orders`);
    if (!response.ok) {
      throw new Error(`Error fetching orders: ${response.statusText}`);
    }
    const orders = await response.json();
    
    // Convert string dates to Date objects
    return orders.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt)
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrder(id: string): Promise<Order> {
  try {
    const response = await fetch(`${API_URL}/orders/${id}`);
    if (!response.ok) {
      throw new Error(`Error fetching order: ${response.statusText}`);
    }
    const order = await response.json();
    
    // Convert string date to Date object
    return {
      ...order,
      createdAt: new Date(order.createdAt)
    };
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new order
 */
export async function createOrder(orderData: Order): Promise<Order> {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      throw new Error(`Error creating order: ${response.statusText}`);
    }
    
    const order = await response.json();
    
    // Convert string date to Date object
    return {
      ...order,
      createdAt: new Date(order.createdAt)
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  try {
    const response = await fetch(`${API_URL}/orders/${id}?status=${status}`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error(`Error updating order status: ${response.statusText}`);
    }
    
    const result = await response.json();
    const order = result.order;
    
    // Convert string date to Date object
    return {
      ...order,
      createdAt: new Date(order.createdAt)
    };
  } catch (error) {
    console.error(`Error updating order ${id} status:`, error);
    throw error;
  }
}

/**
 * Update order rating
 */
export async function updateOrderRating(id: string, rating: number): Promise<Order> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  try {
    const response = await fetch(`${API_URL}/orders/${id}/rating?rating=${rating}`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Server error response:", errorData);
      throw new Error(`Error updating order rating: ${response.statusText}`);
    }
    
    const order = await response.json();
    return {
      ...order,
      createdAt: new Date(order.createdAt)
    };
  } catch (error) {
    console.error(`Error updating order ${id} rating:`, error);
    throw error;
  }
}
