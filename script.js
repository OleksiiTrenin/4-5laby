async function loadProducts() {
  const response = await fetch('products.json');
  const products = await response.json();
  return products;
}


function displayProducts(products) {
  const productGrid = document.getElementById('product-grid');
  const noProducts = document.getElementById('no-products');
  productGrid.innerHTML = '';

  if (products.length === 0) {
    noProducts.classList.remove('hidden');
    return;
  }

  noProducts.classList.add('hidden');
  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card bg-white p-4 rounded shadow flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <img src="${product.image}" alt="${product.name}" class="w-full aspect-w-4 aspect-h-3 object-cover mb-2">
        <h3 class="text-lg font-semibold">${product.name}</h3>
        <p class="text-gray-600">${product.description}</p>
      </div>
      <div class="flex flex-col">
        <p class="font-bold mb-2">$${product.price}</p>
        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 add-to-cart self-start" data-id="${product.id}">Add to Cart</button>
      </div>
    `;
    card.addEventListener('click', () => showModal(product));
    productGrid.appendChild(card);
  });

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      showCartAddModal(button.dataset.id);
    });
  });
}


let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];

cart = cart.map(item => {
  if (typeof item === 'string' || typeof item === 'number') {
    return { id: parseInt(item), quantity: 1 };
  }
  return item;
});
localStorage.setItem('cart', JSON.stringify(cart));

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = totalItems;
  console.log('Cart updated:', cart);
}


function showModal(product) {
  const modal = document.getElementById('product-modal');
  document.getElementById('modal-title').textContent = product.name;
  document.getElementById('modal-image').src = product.image;
  document.getElementById('modal-description').textContent = product.description;
  document.getElementById('modal-price').textContent = `$${product.price}`;
  modal.classList.remove('hidden');
}

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('product-modal').classList.add('hidden');
});


function showCartAddModal(productId) {
  const product = allProducts.find(p => p.id == productId);
  const modal = document.getElementById('cart-add-modal');
  document.getElementById('cart-add-title').textContent = `Додати ${product.name}`;
  document.getElementById('cart-add-price').textContent = `Ціна за одиницю: $${product.price}`;
  const quantityInput = document.getElementById('cart-quantity');
  quantityInput.value = 1;
  const totalPriceElement = document.getElementById('cart-total-price');
  totalPriceElement.textContent = `Загальна ціна: $${(product.price * quantityInput.value).toFixed(2)}`;

  quantityInput.oninput = () => {
    const quantity = parseInt(quantityInput.value) || 1;
    totalPriceElement.textContent = `Загальна ціна: $${(product.price * quantity).toFixed(2)}`;
  };

  modal.classList.remove('hidden');
}


document.getElementById('confirm-add-to-cart').addEventListener('click', () => {
  const productId = allProducts.find(p => p.name === document.getElementById('cart-add-title').textContent.split('Додати ')[1]).id;
  const quantityInput = document.getElementById('cart-quantity');
  const quantity = parseInt(quantityInput.value) || 1;
  const existingItem = cart.find(item => item.id == productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  document.getElementById('cart-add-modal').classList.add('hidden');
  console.log(`Added ${quantity} of product ${productId} to cart`);
});

document.getElementById('close-cart-add-modal').addEventListener('click', () => {
  document.getElementById('cart-add-modal').classList.add('hidden');
});


function showCartModal() {
  const modal = document.getElementById('cart-modal');
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-gray-500 text-center">Кошик порожній.</p>';
  } else {
    cart.forEach((item, index) => {
      const product = allProducts.find(p => p.id == item.id);
      if (!product) {
        console.error(`Product with ID ${item.id} not found`);
        return;
      }
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="cart-item-details">
          <span>${product.name}</span>
          <span class="price">$${product.price} x ${item.quantity} = $${(product.price * item.quantity).toFixed(2)}</span>
        </div>
        <button class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 remove-item" data-index="${index}">Remove</button>
      `;
      cartItems.appendChild(itemDiv);
    });

    document.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showCartModal();
      });
    });
  }
  modal.classList.remove('hidden');
}

document.getElementById('open-cart-modal').addEventListener('click', showCartModal);
document.getElementById('close-cart-modal').addEventListener('click', () => {
  document.getElementById('cart-modal').classList.add('hidden');
});

document.getElementById('clear-cart').addEventListener('click', () => {
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showCartModal();
});

async function init() {
  allProducts = await loadProducts();
  displayProducts(allProducts);
  updateCartCount();
}

document.getElementById('category-filter').addEventListener('change', filterProducts);
document.getElementById('material-filter').addEventListener('change', filterProducts);
document.getElementById('apply-price-filter').addEventListener('click', filterProducts);

function filterProducts() {
  const category = document.getElementById('category-filter').value;
  const material = document.getElementById('material-filter').value;
  const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
  const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;

  const filtered = allProducts.filter(product => {
    const categoryMatch = category === 'all' || product.category === category;
    const materialMatch = material === 'all' || product.material === material;
    const priceMatch = product.price >= minPrice && product.price <= maxPrice;
    return categoryMatch && materialMatch && priceMatch;
  });

  displayProducts(filtered);
}

init();