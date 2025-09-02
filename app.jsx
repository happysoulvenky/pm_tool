// import React, { useEffect, useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
// import axios from "axios";

// const API_BASE = "http://localhost:5000"; // change if needed

// // 📦 Categories Page
// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [name, setName] = useState("");

//   const fetchCategories = async () => {
//     const res = await axios.get(`${API_BASE}/categories`);
//     setCategories(res.data);
//   };

//   const addCategory = async () => {
//     if (!name) return;
//     await axios.post(`${API_BASE}/categories`, { name });
//     setName("");
//     fetchCategories();
//   };

//   const deleteCategory = async (id) => {
//     await axios.delete(`${API_BASE}/categories/${id}`);
//     fetchCategories();
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold mb-4">📂 Categories</h2>
//       <div className="flex gap-2 mb-4">
//         <input
//           className="border rounded px-2 py-1"
//           placeholder="New category"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//         />
//         <button
//           onClick={addCategory}
//           className="bg-blue-500 text-white px-3 py-1 rounded"
//         >
//           Add
//         </button>
//       </div>
//       <ul className="space-y-2">
//         {categories.map((cat) => (
//           <li
//             key={cat.id}
//             className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
//           >
//             <span>{cat.name}</span>
//             <button
//               onClick={() => deleteCategory(cat.id)}
//               className="text-red-500 hover:underline"
//             >
//               Delete
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// // 🛒 Products Page
// function Products() {
//   const [products, setProducts] = useState([]);
//   const [name, setName] = useState("");
//   const [categoryId, setCategoryId] = useState("");
//   const [categories, setCategories] = useState([]);

//   const fetchProducts = async () => {
//     const res = await axios.get(`${API_BASE}/products`);
//     setProducts(res.data);
//   };

//   const fetchCategories = async () => {
//     const res = await axios.get(`${API_BASE}/categories`);
//     setCategories(res.data);
//   };

//   const addProduct = async () => {
//     if (!name || !categoryId) return;
//     await axios.post(`${API_BASE}/products`, {
//       name,
//       category_id: parseInt(categoryId),
//     });
//     setName("");
//     setCategoryId("");
//     fetchProducts();
//   };

//   const deleteProduct = async (id) => {
//     await axios.delete(`${API_BASE}/products/${id}`);
//     fetchProducts();
//   };

//   useEffect(() => {
//     fetchProducts();
//     fetchCategories();
//   }, []);

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold mb-4">🛒 Products</h2>
//       <div className="flex gap-2 mb-4">
//         <input
//           className="border rounded px-2 py-1"
//           placeholder="Product name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//         />
//         <select
//           className="border rounded px-2 py-1"
//           value={categoryId}
//           onChange={(e) => setCategoryId(e.target.value)}
//         >
//           <option value="">Select category</option>
//           {categories.map((c) => (
//             <option key={c.id} value={c.id}>
//               {c.name}
//             </option>
//           ))}
//         </select>
//         <button
//           onClick={addProduct}
//           className="bg-green-500 text-white px-3 py-1 rounded"
//         >
//           Add
//         </button>
//       </div>
//       <ul className="space-y-2">
//         {products.map((p) => (
//           <li
//             key={p.id}
//             className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
//           >
//             <span>
//               {p.name}{" "}
//               <span className="text-sm text-gray-500">
//                 (Category ID: {p.category_id})
//               </span>
//             </span>
//             <button
//               onClick={() => deleteProduct(p.id)}
//               className="text-red-500 hover:underline"
//             >
//               Delete
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// // 🌐 App Component
// export default function App() {
//   return (
//     <Router>
//       <div className="flex flex-col min-h-screen">
//         <nav className="bg-gray-800 text-white px-6 py-3 flex gap-4">
//           <Link to="/categories" className="hover:underline">
//             Categories
//           </Link>
//           <Link to="/products" className="hover:underline">
//             Products
//           </Link>
//         </nav>
//         <main className="flex-1">
//           <Routes>
//             <Route path="/categories" element={<Categories />} />
//             <Route path="/products" element={<Products />} />
//             <Route
//               path="/"
//               element={
//                 <div className="p-6 text-center">
//                   <h1 className="text-2xl font-bold">
//                     🚀 Product Catalog Tool
//                   </h1>
//                   <p className="text-gray-600 mt-2">
//                     Use the navigation above to manage categories & products
//                   </p>
//                 </div>
//               }
//             />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }
