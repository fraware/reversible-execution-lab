import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Github, User, Bot, Cpu, Bookmark, Eye, ArrowLeftRight } from 'lucide-react';

const Project: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-8 lg:px-16 flex flex-col items-center justify-center min-h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545670723-196ed0954986?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2952&q=80')] bg-cover bg-center opacity-5 z-0"></div>
        
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="animate-slide-up bg-primary/10 h-2 w-64 absolute top-1/4 left-1/3"></div>
          <div className="animate-slide-up bg-primary/10 h-2 w-48 absolute top-1/3 left-1/4 delay-300"></div>
          <div className="animate-slide-up bg-primary/10 h-2 w-72 absolute top-2/5 left-1/2 delay-500"></div>
          <div className="animate-slide-up bg-primary/10 h-2 w-56 absolute top-1/2 left-1/3 delay-700"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Reversible Debugging, Simplified
          </h1>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-6">
            Step Forward. Step Back. Debug Smarter.
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 text-muted-foreground">
            An open-source interactive debugger that lets you execute programs forward and backward with ease. 
            Designed for developers, researchers, and educators.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group" asChild>
              <Link to="/login">
                Get Started <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="group">
              <a href="https://github.com/fraware/reversible-execution-lab" target="_blank" rel="noopener noreferrer" className="flex items-center">
                <Github className="mr-2" /> View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* About the Project */}
      <section className="py-16 px-4 md:px-8 bg-muted/30" id="about">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">About the Project</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-lg animate-fade-in hover-scale">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <ArrowLeftRight className="mr-2 text-primary" /> What is IRD?
              </h3>
              <p className="text-muted-foreground">
                The Interactive Reversible Debugger (IRD) is a revolutionary tool that enables bidirectional program execution. 
                Unlike traditional debuggers, IRD lets you step backward through code execution, 
                providing unparalleled insights into your program's behavior.
              </p>
            </div>
            
            <div className="glass-panel p-8 rounded-lg animate-fade-in hover-scale delay-100">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <Cpu className="mr-2 text-primary" /> Why It Matters?
              </h3>
              <p className="text-muted-foreground">
                Reversible debugging dramatically improves productivity by eliminating the need to restart debugging sessions. 
                It's crucial for quantum computing, educational contexts, and complex debugging scenarios where 
                tracing the origin of bugs requires backward analysis.
              </p>
            </div>
            
            <div className="glass-panel p-8 rounded-lg animate-fade-in hover-scale delay-200">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <Eye className="mr-2 text-primary" /> How It Works?
              </h3>
              <p className="text-muted-foreground">
                IRD efficiently captures program states as execution proceeds, creating a navigable timeline. 
                Our innovative diff-based state storage minimizes memory overhead while enabling precise 
                state reconstruction at any point in program execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 md:px-8" id="features">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Features</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16">
            Powerful tools for forward and backward debugging, state visualization, and interactive exploration of program execution.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Core Features */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowLeftRight className="mr-2 text-primary" /> Step Execution
                </CardTitle>
                <CardDescription>Navigate program execution bidirectionally</CardDescription>
              </CardHeader>
              <CardContent>
                Move forward and backward through code execution with intuitive controls, making debugging efficient and insightful.
              </CardContent>
            </Card>
            
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bookmark className="mr-2 text-primary" /> Breakpoints & Checkpoints
                </CardTitle>
                <CardDescription>Set reversible breakpoints and save states</CardDescription>
              </CardHeader>
              <CardContent>
                Place markers at critical points and jump directly to saved checkpoints, streamlining the debugging workflow.
              </CardContent>
            </Card>
            
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 text-primary" /> State Visualization
                </CardTitle>
                <CardDescription>See your program state change in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                Watch variables, memory, and execution context change as you step through your code in either direction.
              </CardContent>
            </Card>
            
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="mr-2 text-primary" /> Quantum Algorithm Support
                </CardTitle>
                <CardDescription>Specially designed for quantum computing</CardDescription>
              </CardHeader>
              <CardContent>
                Visualize quantum states, circuit diagrams, and reversible quantum gates with specialized tools for quantum developers.
              </CardContent>
            </Card>
            
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 text-primary" /> User-Friendly Interface
                </CardTitle>
                <CardDescription>Intuitive design for all skill levels</CardDescription>
              </CardHeader>
              <CardContent>
                A clean, modern interface that makes reversible debugging accessible to developers at any experience level.
              </CardContent>
            </Card>
            
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 text-primary" /> AI Chat Debugging
                </CardTitle>
                <CardDescription>Get AI-powered assistance while debugging</CardDescription>
              </CardHeader>
              <CardContent>
                Our experimental AI chat mode helps identify issues and suggests fixes as you debug, accelerating problem resolution.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section Placeholder */}
      <section className="py-16 px-4 md:px-8 bg-muted/30" id="demo">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Interactive Demo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Try our simplified interactive demo below, or log in to access the full reversible debugger experience.
          </p>
          
          <div className="glass-panel p-8 rounded-lg max-w-4xl mx-auto aspect-video flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-medium mb-6">Demo Coming Soon</h3>
              <p className="mb-8">Our interactive demo is under development. Sign up to get early access!</p>
              <Button asChild>
                <Link to="/login">Sign Up for Early Access</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community & Contribution */}
      <section className="py-16 px-4 md:px-8" id="community">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Community & Contributions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass-panel p-8 rounded-lg animate-fade-in">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <Github className="mr-2 text-primary" /> How to Contribute
              </h3>
              <p className="mb-6 text-muted-foreground">
                We welcome contributions from developers of all skill levels. Whether you're fixing bugs, 
                adding features, or improving documentation, your help is valuable.
              </p>
              <ul className="space-y-2 list-disc pl-5 mb-6 text-muted-foreground">
                <li>Check out our GitHub Issues for beginner-friendly tasks</li>
                <li>Review our contribution guidelines before submitting PRs</li>
                <li>Join our community discussions to suggest improvements</li>
                <li>Help us test new features in development</li>
              </ul>
              <Button variant="outline" className="hover-scale">
                <a href="https://github.com/fraware/reversible-execution-lab" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Github className="mr-2" /> Visit Repository
                </a>
              </Button>
            </div>
            
            <div className="glass-panel p-8 rounded-lg animate-fade-in">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <User className="mr-2 text-primary" /> Testimonials & Use Cases
              </h3>
              
              <div className="space-y-6">
                <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                  "The reversible debugging capabilities have transformed how we teach programming fundamentals. 
                  Students can now trace execution flow in both directions, significantly enhancing their understanding."
                  <footer className="text-sm mt-2 not-italic">— Dr. Emily Chen, Computer Science Professor</footer>
                </blockquote>
                
                <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                  "As a quantum algorithm researcher, the ability to step backward through quantum state changes 
                  has been invaluable for understanding complex entanglement behaviors."
                  <footer className="text-sm mt-2 not-italic">— Marco Rodriguez, Quantum Computing Researcher</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Support */}
      <section className="py-16 px-4 md:px-8 bg-muted/30" id="contact">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Contact & Support</h2>
          
          <div className="max-w-3xl mx-auto glass-panel p-8 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Support Channels</h3>
                <ul className="space-y-2 text-muted-foreground text-left">
                  <li>• Comprehensive Documentation</li>
                  <li>• Frequently Asked Questions</li>
                  <li>• GitHub Discussions</li>
                  <li>• Community Forums</li>
                </ul>
                <Button variant="outline" className="mt-6 hover-scale">
                  <a href="#" className="flex items-center">
                    Documentation
                  </a>
                </Button>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Business & Research</h3>
                <p className="text-muted-foreground mb-6 text-left">
                  Interested in using IRD for research, education, or enterprise? 
                  Reach out to discuss partnerships, custom deployments, or research collaborations.
                </p>
                <Button className="hover-scale">
                  <Link to="/login">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 md:px-8 bg-secondary text-secondary-foreground">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold">Reversible Debugger</h2>
              <p className="text-secondary-foreground/70">Step Forward. Step Back. Debug Smarter.</p>
            </div>
            
            <div className="flex space-x-6">
              <a href="https://github.com/fraware/reversible-execution-lab" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
                <Github size={24} />
              </a>
              <a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
                <Bot size={24} />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-secondary-foreground/20 text-center text-secondary-foreground/70">
            <p>© {new Date().getFullYear()} Interactive Reversible Debugger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Project;
