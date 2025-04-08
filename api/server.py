"""
Denov Baraka Somsa REST API with SQLite

This is a simple REST API for the Denov Baraka Somsa application.
It provides endpoints for products and orders management using SQLite database.

To run:
1. Install requirements: pip install fastapi uvicorn sqlalchemy
2. Run server: uvicorn server:app --reload
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
import os
import shutil
import uuid
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session

# Database configuration - SQLite
DATABASE_URL = "sqlite:///denov_baraka.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Database models
class ProductModel(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    image = Column(String, nullable=True)
    popular = Column(Boolean, default=False)

class CustomerInfoModel(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"))
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    
class OrderItemModel(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"))
    product_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String, nullable=True)
    category = Column(String, nullable=True)

class OrderModel(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True)
    total = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    free_delivery = Column(Boolean, default=False)
    rating = Column(Integer, nullable=True)  # Add this line
    
    customer = relationship("CustomerInfoModel", backref="order", uselist=False, cascade="all, delete-orphan")
    items = relationship("OrderItemModel", backref="order", cascade="all, delete-orphan")

# Create tables in the database
Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class CustomerInfo(BaseModel):
    name: str
    phone: str
    address: str
    
    class Config:
        orm_mode = True

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    description: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    
    class Config:
        orm_mode = True

class Order(BaseModel):
    id: str
    items: List[CartItem]
    customer: CustomerInfo
    total: float
    status: str
    createdAt: datetime
    freeDelivery: bool
    rating: Optional[int] = None  # Add this line
    
    class Config:
        orm_mode = True

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image: Optional[str] = None
    popular: Optional[bool] = False
    
    class Config:
        orm_mode = True

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

# Helper functions
def db_product_to_schema(product):
    return Product(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        category=product.category,
        image=product.image,
        popular=product.popular
    )

def db_order_to_schema(db_order, db_customer, db_items):
    cart_items = [
        CartItem(
            id=item.product_id,
            name=item.name,
            price=item.price,
            quantity=item.quantity,
            description=item.description,
            image=item.image,
            category=item.category
        ) for item in db_items
    ]
    
    customer = CustomerInfo(
        name=db_customer.name,
        phone=db_customer.phone,
        address=db_customer.address
    )
    
    return Order(
        id=db_order.id,
        items=cart_items,
        customer=customer,
        total=db_order.total,
        status=db_order.status,
        createdAt=db_order.created_at,
        freeDelivery=db_order.free_delivery,
        rating=db_order.rating  # Add this line
    )

# API endpoints
@app.get("/")
def read_root():
    return {"message": "Welcome to Denov Baraka Somsa API"}

# Product endpoints
@app.get("/products", response_model=List[Product])
def get_products(db: Session = Depends(get_db)):
    db_products = db.query(ProductModel).all()
    return [db_product_to_schema(product) for product in db_products]

@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: str, db: Session = Depends(get_db)):
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product_to_schema(db_product)

@app.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    popular: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
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
        new_product = ProductModel(
            id=product_id,
            name=name.strip(),
            description=description.strip(),
            price=price,
            category=category.strip(),
            popular=popular,
            image=image_path
        )
        
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        
        return db_product_to_schema(new_product)
    except Exception as e:
        db.rollback()
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
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Find the product
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product data
    if name is not None:
        product.name = name
    
    if description is not None:
        product.description = description
    
    if price is not None:
        product.price = price
    
    if category is not None:
        product.category = category
    
    if popular is not None:
        if isinstance(popular, str):
            product.popular = popular.lower() == "true"
        else:
            product.popular = popular
    
    if image:
        # Delete old image if exists
        if product.image and os.path.exists(product.image.lstrip("/")):
            try:
                os.remove(product.image.lstrip("/"))
            except:
                pass
        
        # Save the new image
        file_extension = os.path.splitext(image.filename)[1]
        image_path = f"uploads/{product_id}{file_extension}"
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Use relative path for storage
        product.image = f"/{image_path}"
    
    try:
        db.commit()
        db.refresh(product)
        return db_product_to_schema(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating product: {str(e)}"
        )

@app.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete the product image if it exists
    if product.image and os.path.exists(product.image.lstrip("/")):
        try:
            os.remove(product.image.lstrip("/"))
        except:
            pass
    
    try:
        db.delete(product)
        db.commit()
        return {"message": f"Product {product_id} deleted", "product": db_product_to_schema(product)}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting product: {str(e)}"
        )

# Order endpoints
@app.get("/orders", response_model=List[Order])
def get_orders(db: Session = Depends(get_db)):
    db_orders = db.query(OrderModel).all()
    result = []
    
    for order in db_orders:
        customer = db.query(CustomerInfoModel).filter(CustomerInfoModel.order_id == order.id).first()
        items = db.query(OrderItemModel).filter(OrderItemModel.order_id == order.id).all()
        result.append(db_order_to_schema(order, customer, items))
    
    return result

@app.get("/orders/{order_id}", response_model=Order)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    customer = db.query(CustomerInfoModel).filter(CustomerInfoModel.order_id == order_id).first()
    items = db.query(OrderItemModel).filter(OrderItemModel.order_id == order_id).all()
    
    return db_order_to_schema(order, customer, items)

@app.post("/orders", response_model=Order)
def create_order(order: Order, db: Session = Depends(get_db)):
    try:
        # Create order
        db_order = OrderModel(
            id=order.id,
            total=order.total,
            status=order.status,
            created_at=order.createdAt,
            free_delivery=order.freeDelivery
        )
        db.add(db_order)
        
        # Create customer info
        db_customer = CustomerInfoModel(
            order_id=order.id,
            name=order.customer.name,
            phone=order.customer.phone,
            address=order.customer.address
        )
        db.add(db_customer)
        
        # Create order items
        for item in order.items:
            db_item = OrderItemModel(
                order_id=order.id,
                product_id=item.id,
                name=item.name,
                price=item.price,
                quantity=item.quantity,
                description=item.description,
                image=item.image,
                category=item.category
            )
            db.add(db_item)
        
        db.commit()
        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating order: {str(e)}"
        )

@app.put("/orders/{order_id}")
def update_order_status(order_id: str, status: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    
    try:
        db.commit()
        db.refresh(order)
        
        customer = db.query(CustomerInfoModel).filter(CustomerInfoModel.order_id == order_id).first()
        items = db.query(OrderItemModel).filter(OrderItemModel.order_id == order_id).all()
        
        return {
            "message": f"Order {order_id} status updated to {status}", 
            "order": db_order_to_schema(order, customer, items)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating order status: {str(e)}"
        )

@app.put("/orders/{order_id}/rating")
def update_order_rating(order_id: str, rating: int, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    order.rating = rating
    
    try:
        db.commit()
        db.refresh(order)
        
        customer = db.query(CustomerInfoModel).filter(CustomerInfoModel.order_id == order_id).first()
        items = db.query(OrderItemModel).filter(OrderItemModel.order_id == order_id).all()
        
        return db_order_to_schema(order, customer, items)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating order rating: {str(e)}"
        )

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)