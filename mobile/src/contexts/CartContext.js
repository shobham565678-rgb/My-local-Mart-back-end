import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartAPI } from '../services/api';

const CartContext = createContext();

const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isLoading: false,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        totalItems: action.payload.totalItems || 0,
        totalAmount: action.payload.totalAmount || 0,
        isLoading: false,
      };
    case 'ADD_ITEM':
      return {
        ...state,
        items: action.payload.items,
        totalItems: action.payload.totalItems,
        totalAmount: action.payload.totalAmount,
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: action.payload.items,
        totalItems: action.payload.totalItems,
        totalAmount: action.payload.totalAmount,
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: action.payload.items,
        totalItems: action.payload.totalItems,
        totalAmount: action.payload.totalAmount,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Try to load from API first
      const response = await cartAPI.getCart();
      if (response.success) {
        const cart = response.data.cart;
        dispatch({
          type: 'SET_CART',
          payload: {
            items: cart.items || [],
            totalItems: cart.totalItems || 0,
            totalAmount: cart.totalAmount || 0,
          },
        });
      } else {
        // Fallback to local storage
        const localCart = await AsyncStorage.getItem('cartData');
        if (localCart) {
          const cart = JSON.parse(localCart);
          dispatch({
            type: 'SET_CART',
            payload: cart,
          });
        }
      }
    } catch (error) {
      console.error('Load cart error:', error);
      // Fallback to local storage
      try {
        const localCart = await AsyncStorage.getItem('cartData');
        if (localCart) {
          const cart = JSON.parse(localCart);
          dispatch({
            type: 'SET_CART',
            payload: cart,
          });
        }
      } catch (localError) {
        console.error('Local cart load error:', localError);
      }
    }
  };

  const saveCartLocally = async (cartData) => {
    try {
      await AsyncStorage.setItem('cartData', JSON.stringify(cartData));
    } catch (error) {
      console.error('Save cart locally error:', error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartAPI.addToCart(productId, quantity);
      
      if (response.success) {
        const cart = response.data.cart;
        const cartData = {
          items: cart.items || [],
          totalItems: cart.totalItems || 0,
          totalAmount: cart.totalAmount || 0,
        };
        
        dispatch({
          type: 'ADD_ITEM',
          payload: cartData,
        });
        
        await saveCartLocally(cartData);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add to cart' 
      };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartAPI.updateCartItem(productId, quantity);
      
      if (response.success) {
        const cart = response.data.cart;
        const cartData = {
          items: cart.items || [],
          totalItems: cart.totalItems || 0,
          totalAmount: cart.totalAmount || 0,
        };
        
        dispatch({
          type: 'UPDATE_ITEM',
          payload: cartData,
        });
        
        await saveCartLocally(cartData);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Update cart item error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update cart item' 
      };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartAPI.removeFromCart(productId);
      
      if (response.success) {
        const cart = response.data.cart;
        const cartData = {
          items: cart.items || [],
          totalItems: cart.totalItems || 0,
          totalAmount: cart.totalAmount || 0,
        };
        
        dispatch({
          type: 'REMOVE_ITEM',
          payload: cartData,
        });
        
        await saveCartLocally(cartData);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to remove from cart' 
      };
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cartAPI.clearCart();
      
      if (response.success) {
        dispatch({ type: 'CLEAR_CART' });
        await AsyncStorage.removeItem('cartData');
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to clear cart' 
      };
    }
  };

  const getCartSummary = () => {
    return {
      totalItems: state.totalItems,
      totalAmount: state.totalAmount,
      itemCount: state.items.length,
    };
  };

  const value = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary,
    loadCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};





