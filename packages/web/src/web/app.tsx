import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { Navbar } from "./components/Navbar";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";
import { FaultBackground } from "./components/FaultBackground";
import { ReferralTracker } from "./components/ReferralTracker";
import Index from "./pages/index";
import ShopPage from "./pages/shop";
import ProductPage from "./pages/product";
import CartPage from "./pages/cart";
import CheckoutPage from "./pages/checkout";
import OrderSuccessPage from "./pages/order-success";
import AdminPage from "./pages/admin";
import BlogListPage from "./pages/blog";
import BlogPostPage from "./pages/blog-post";
import RewardsPage from "./pages/rewards";
import CustomRequestPage from "./pages/custom-request";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function App() {
  return (
    <Provider>
      <ScrollToTop />
      <FaultBackground />
      <ReferralTracker />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <CartDrawer />
        <main style={{ flex: 1 }}>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/shop" component={ShopPage} />
            <Route path="/product/:id" component={ProductPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/order-success" component={OrderSuccessPage} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/kingz-talk" component={BlogListPage} />
            <Route path="/kingz-talk/:slug" component={BlogPostPage} />
            <Route path="/rewards" component={RewardsPage} />
            <Route path="/custom-request" component={CustomRequestPage} />
          </Switch>
        </main>
        <Footer />
      </div>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
