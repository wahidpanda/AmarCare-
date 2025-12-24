``` mermaid
graph TB
    A[User Access] --> B{Home Page}
    B --> C[Disease Prediction]
    B --> D[AI Chatbot]
    B --> E[Health Resources]
    
    C --> C1[Diabetes Check]
    C --> C2[Heart Check]
    C --> C3[Kidney Check]
    
    C1 --> F[Input Health Parameters]
    C2 --> F
    C3 --> F
    
    F --> G[ML Model Processing]
    G --> H[Prediction Result]
    H --> I[Health Advice]
    I --> J[Find Doctors]
    
    D --> K[Ask Health Questions]
    D --> L[Upload Documents]
    K --> M[Gemini AI Processing]
    L --> M
    M --> N[AI Response]
    
    J --> O[Geolocation]
    O --> P[Doctor Results]
    P --> Q[Navigation & Contact]
    
    subgraph "Backend Services"
        R[Flask Server]
        S[Machine Learning Models]
        T[Gemini AI API]
        U[Database]
    end
    
    G --> R
    M --> T
    J --> R
    R --> S
    R --> T
    R --> U
```
