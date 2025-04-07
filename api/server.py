"""
Denov Baraka Somsa REST API

This is a simple REST API for the Denov Baraka Somsa application.
It provides endpoints for products and orders management.

To run:
1. Install requirements: pip install fastapi uvicorn python-dotenv
2. Run server: uvicorn server:app --reload
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import json
import os
import shutil
import uuid

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="Denov Baraka Somsa API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (uploads)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Data models
class CustomerInfo(BaseModel):
    name: str
    phone: str
    address: str

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    description: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None

class Order(BaseModel):
    id: str
    items: List[CartItem]
    customer: CustomerInfo
    total: float
    status: str
    createdAt: datetime
    freeDelivery: bool

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image: Optional[str] = None
    popular: Optional[bool] = False

# In-memory storage (in production, use a database)
# Load data from JSON files if they exist
def load_data():
    products = []
    orders = []
    
    if os.path.exists("products.json"):
        with open("products.json", "r", encoding="utf-8") as f:
            products = json.load(f)
    
    if os.path.exists("orders.json"):
        with open("orders.json", "r", encoding="utf-8") as f:
            orders = json.load(f)
            # Convert string dates to datetime objects
            for order in orders:
                order["createdAt"] = datetime.fromisoformat(order["createdAt"].replace("Z", "+00:00"))
    
    return products, orders

products, orders = load_data()

# Save data to JSON files
def save_data():
    with open("products.json", "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    # Convert datetime objects to ISO format strings for JSON serialization
    serializable_orders = []
    for order in orders:
        serializable_order = order.copy()
        if isinstance(order["createdAt"], datetime):
            serializable_order["createdAt"] = order["createdAt"].isoformat()
        serializable_orders.append(serializable_order)
    
    with open("orders.json", "w", encoding="utf-8") as f:
        json.dump(serializable_orders, f, ensure_ascii=False, indent=2)

# API endpoints
@app.get("/")
def read_root():
    return {"message": "Welcome to Denov Baraka Somsa API"}

# Product endpoints
@app.get("/products", response_model=List[Product])
def get_products():
    return products

@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: str):
    for product in products:
        if product["id"] == product_id:
            return product
    raise HTTPException(status_code=404, detail="Product not found")

@app.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    popular: bool = Form(False),
    image: Optional[UploadFile] = File(None)
):
    if price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price must be greater than 0"
        )
    
    product_id = f"p{str(uuid.uuid4())[:8]}"
    
    image_path = None
    if image:
        try:
            # Validate image file extension
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            file_extension = os.path.splitext(image.filename)[1].lower()
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP"
                )

            # Save the uploaded image
            image_path = f"uploads/{product_id}{file_extension}"
            
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            # Use relative path for storage
            image_path = f"/{image_path}"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error uploading image: {str(e)}"
            )
    
    try:
        new_product = {
            "id": product_id,
            "name": name.strip(),
            "description": description.strip(),
            "price": price,
            "category": category.strip(),
            "popular": popular,
            "image": image_path
        }
        
        products.append(new_product)
        save_data()
        
        return new_product
    except Exception as e:
        # If product creation fails, delete uploaded image
        if image_path and os.path.exists(image_path.lstrip("/")):
            try:
                os.remove(image_path.lstrip("/"))
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating product: {str(e)}"
        )

@app.put("/products/{product_id}")
async def update_product(
    product_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    popular: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    # Find the product
    product_index = None
    for i, product in enumerate(products):
        if product["id"] == product_id:
            product_index = i
            break
    
    if product_index is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product data
    product = products[product_index]
    
    if name is not None:
        product["name"] = name
    
    if description is not None:
        product["description"] = description
    
    if price is not None:
        product["price"] = price
    
    if category is not None:
        product["category"] = category
    
    if popular is not None:
        if isinstance(popular, str):
            product["popular"] = popular.lower() == "true"
        else:
            product["popular"] = popular
    
    if image:
        # Delete old image if exists
        if product.get("image") and os.path.exists(product["image"].lstrip("/")):
            try:
                os.remove(product["image"].lstrip("/"))
            except:
                pass
        
        # Save the new image
        file_extension = os.path.splitext(image.filename)[1]
        image_path = f"uploads/{product_id}{file_extension}"
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Use relative path for storage
        product["image"] = f"/{image_path}"
    
    # Update the product in the list
    products[product_index] = product
    save_data()
    
    return product

@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    for i, product in enumerate(products):
        if product["id"] == product_id:
            # Delete the product image if it exists
            if product.get("image") and os.path.exists(product["image"].lstrip("/")):
                try:
                    os.remove(product["image"].lstrip("/"))
                except:
                    pass
            
            deleted_product = products.pop(i)
            save_data()
            return {"message": f"Product {product_id} deleted", "product": deleted_product}
    
    raise HTTPException(status_code=404, detail="Product not found")

# Order endpoints
@app.get("/orders", response_model=List[Order])
def get_orders():
    return orders

@app.get("/orders/{order_id}", response_model=Order)
def get_order(order_id: str):
    for order in orders:
        if order["id"] == order_id:
            return order
    raise HTTPException(status_code=404, detail="Order not found")

@app.post("/orders", response_model=Order)
def create_order(order: Order):
    orders.append(order.dict())
    save_data()
    return order

@app.put("/orders/{order_id}")
def update_order_status(order_id: str, status: str):
    for order in orders:
        if order["id"] == order_id:
            order["status"] = status
            save_data()
            return {"message": f"Order {order_id} status updated to {status}", "order": order}
    
    raise HTTPException(status_code=404, detail="Order not found")

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
