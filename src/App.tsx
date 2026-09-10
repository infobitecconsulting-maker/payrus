import { Masthead } from "@/components/landing/Masthead";
import { Hero } from "@/components/landing/Hero";
import { HeroPhoto } from "@/components/landing/HeroPhoto";
import { Rails } from "@/components/landing/Rails";
import { LastMile } from "@/components/landing/LastMile";
import { Roles } from "@/components/landing/Roles";
import { Corridors } from "@/components/landing/Corridors";
import { SignupClose } from "@/components/landing/SignupClose";
import { Footer } from "@/components/landing/Footer";

function App() {
  return (
    <div id="top">
      <Masthead />
      <Hero />
      <HeroPhoto />
      <Rails />
      <LastMile />
      <Roles />
      <Corridors />
      <SignupClose />
      <Footer />
    </div>
  );
}

export default App;
