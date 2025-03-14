
import React from "react";
import { Link } from "react-router-dom";
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail,
  LineChart
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { 
      title: "Product", 
      links: [
        { name: "Features", url: "#features" },
        { name: "Pricing", url: "#pricing" },
        { name: "API", url: "#api" },
      ] 
    },
    { 
      title: "Company", 
      links: [
        { name: "About", url: "#about" },
        { name: "Blog", url: "#blog" },
        { name: "Careers", url: "#careers" },
      ] 
    },
    { 
      title: "Resources", 
      links: [
        { name: "Documentation", url: "#docs" },
        { name: "Help Center", url: "#help" },
        { name: "Privacy", url: "#privacy" },
      ] 
    },
  ];

  const socialLinks = [
    { icon: <Github className="size-5" />, url: "#github" },
    { icon: <Twitter className="size-5" />, url: "#twitter" },
    { icon: <Linkedin className="size-5" />, url: "#linkedin" },
    { icon: <Mail className="size-5" />, url: "#contact" },
  ];

  return (
    <footer className="border-t border-border/30 bg-background/80 pt-16 pb-8">
      <div className="container-padding mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 justify-between mb-12">
          {/* Logo and description */}
          <div className="lg:max-w-xs">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <LineChart className="size-6 text-primary" />
              <span className="text-xl font-medium">StockGenie</span>
            </Link>
            <p className="text-muted-foreground">
              Cutting-edge stock market analysis with AI-powered insights and real-time data visualization.
            </p>
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.url} 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Social media link"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-10">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="font-medium mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.url} 
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom line */}
        <div className="pt-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} StockGenie. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
