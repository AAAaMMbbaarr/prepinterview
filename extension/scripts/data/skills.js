// PrepInterview Copilot - Single Source of Truth Skill Taxonomy (400+ Skills)
(function() {
  'use strict';

  const SKILLS_DATA = [
  {
    "canonical": "Machine Learning",
    "aliases": [
      "ml",
      "machine-learning"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Deep Learning",
    "aliases": [
      "deep-learning",
      "dnn",
      "neural networks"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Large Language Models",
    "aliases": [
      "llm",
      "llms",
      "large language model"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Generative AI",
    "aliases": [
      "genai",
      "generative-ai",
      "gen ai"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Natural Language Processing",
    "aliases": [
      "nlp",
      "computational linguistics",
      "text processing"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Computer Vision",
    "aliases": [
      "cv",
      "image recognition",
      "object detection",
      "image segmentation"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "PyTorch",
    "aliases": [
      "torch"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "TensorFlow",
    "aliases": [
      "tf"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Keras",
    "aliases": [
      "keras api"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Scikit-Learn",
    "aliases": [
      "sklearn"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Hugging Face",
    "aliases": [
      "huggingface",
      "transformers library",
      "diffusers"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "LangChain",
    "aliases": [
      "langchain framework"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "LlamaIndex",
    "aliases": [
      "gpt index"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "RAG",
    "aliases": [
      "retrieval augmented generation",
      "retrieval-augmented generation"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Vector Database",
    "aliases": [
      "vector db",
      "vector store",
      "pinecone",
      "weaviate",
      "milvus",
      "chromadb",
      "qdrant"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Prompt Engineering",
    "aliases": [
      "prompt design",
      "prompt optimization",
      "few-shot prompting"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Fine-Tuning",
    "aliases": [
      "model fine-tuning",
      "lora",
      "qlora",
      "peft",
      "sft"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Embeddings",
    "aliases": [
      "vector embeddings",
      "text embeddings",
      "sentence embeddings"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "OpenAI API",
    "aliases": [
      "openai",
      "gpt-4",
      "gpt-4o",
      "chatgpt api",
      "text-embedding-3"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Claude",
    "aliases": [
      "claude api",
      "anthropic claude",
      "claude 3",
      "claude 3.5",
      "claude sonnet",
      "claude opus"
    ],
    "category": "ai_ml",
    "guarded": "claude"
  },
  {
    "canonical": "Midjourney",
    "aliases": [
      "midjourney ai",
      "stable diffusion",
      "dall-e",
      "comfyui"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Reinforcement Learning",
    "aliases": [
      "rl",
      "rlhf",
      "dpo",
      "q-learning",
      "policy gradient"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "MLOps",
    "aliases": [
      "ml ops",
      "mlflow",
      "kubeflow",
      "weights and biases",
      "wandb",
      "model registry"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Model Evaluation",
    "aliases": [
      "model benchmarking",
      "perplexity",
      "evals framework",
      "bleu score",
      "rouge score"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Feature Engineering",
    "aliases": [
      "feature selection",
      "feature store",
      "feast feature store"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "XGBoost",
    "aliases": [
      "lightgbm",
      "catboost",
      "gradient boosting"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Semantic Search",
    "aliases": [
      "dense retrieval",
      "sparse retrieval",
      "hybrid search",
      "bm25"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Speech Recognition",
    "aliases": [
      "whisper",
      "asr",
      "speech to text",
      "stt"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Text to Speech",
    "aliases": [
      "tts",
      "voice synthesis",
      "elevenlabs"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Diffusion Models",
    "aliases": [
      "latent diffusion",
      "stable diffusion xl"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Knowledge Graphs",
    "aliases": [
      "rdf",
      "sparql",
      "ontology modeling",
      "neo4j graph"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Recommendation Systems",
    "aliases": [
      "recsys",
      "collaborative filtering",
      "two-tower models"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Time Series Forecasting",
    "aliases": [
      "prophet",
      "arima",
      "exponential smoothing",
      "temporal fusion"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Anomaly Detection",
    "aliases": [
      "outlier detection",
      "isolation forest",
      "fraud detection algorithms"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "AutoML",
    "aliases": [
      "h2o.ai",
      "automl framework",
      "tpot"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Data Labeling",
    "aliases": [
      "snorkel",
      "scale ai",
      "labelbox",
      "prodigy"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Model Quantization",
    "aliases": [
      "gguf",
      "awq",
      "gptq",
      "onnx runtime",
      "tensorrt"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Agentic Workflows",
    "aliases": [
      "ai agents",
      "multi-agent systems",
      "autogen",
      "crewai"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Transformer Architecture",
    "aliases": [
      "attention mechanism",
      "self-attention",
      "bert",
      "roberta",
      "t5"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Supervised Learning",
    "aliases": [
      "classification algorithms",
      "regression algorithms",
      "random forest",
      "logistic regression"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Unsupervised Learning",
    "aliases": [
      "k-means clustering",
      "hierarchical clustering",
      "pca",
      "t-sne",
      "umap"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Hyperparameter Tuning",
    "aliases": [
      "optuna",
      "hyperopt",
      "grid search",
      "bayesian optimization"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Data Augmentation",
    "aliases": [
      "image augmentation",
      "text augmentation",
      "synthetic data generation"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Model Interpretability",
    "aliases": [
      "shap",
      "lime",
      "feature importance",
      "explainable ai",
      "xai"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "CUDA",
    "aliases": [
      "gpu acceleration",
      "nvidia cuda",
      "cudnn"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Distributed Training",
    "aliases": [
      "deepspeed",
      "fsdp",
      "megatron-lm",
      "data parallelism",
      "model parallelism"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Bioinformatics",
    "aliases": [
      "computational biology",
      "biopython"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "OpenCV",
    "aliases": [
      "opencv library",
      "cv2"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "NLTK",
    "aliases": [
      "nltk library",
      "spacy",
      "textblob"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Polars",
    "aliases": [
      "python polars",
      "polars dataframe"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Jupyter",
    "aliases": [
      "jupyter notebook",
      "jupyterlab",
      "ipython"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Statistical Modeling",
    "aliases": [
      "bayesian inference",
      "markov chain",
      "mcmc"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Model Serving",
    "aliases": [
      "triton inference server",
      "vllm",
      "tgi",
      "ollama"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "AI Safety",
    "aliases": [
      "ai alignment",
      "guardrails ai",
      "red teaming llm",
      "hallucination mitigation"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Graph Neural Networks",
    "aliases": [
      "gnn",
      "pyg",
      "dgl graph"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "SQL",
    "aliases": [
      "structured query language"
    ],
    "category": "analytics",
    "guarded": "sql"
  },
  {
    "canonical": "PostgreSQL",
    "aliases": [
      "postgres",
      "pgsql"
    ],
    "category": "analytics",
    "implies": [
      "SQL"
    ]
  },
  {
    "canonical": "MySQL",
    "aliases": [
      "my sql"
    ],
    "category": "analytics",
    "implies": [
      "SQL"
    ]
  },
  {
    "canonical": "T-SQL",
    "aliases": [
      "tsql",
      "transact-sql",
      "mssql",
      "sql server"
    ],
    "category": "analytics",
    "implies": [
      "SQL"
    ]
  },
  {
    "canonical": "NoSQL",
    "aliases": [
      "non-relational db",
      "nosql database"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Pandas",
    "aliases": [
      "python pandas"
    ],
    "category": "analytics"
  },
  {
    "canonical": "NumPy",
    "aliases": [
      "numpy library"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Tableau",
    "aliases": [
      "tableau desktop",
      "tableau server",
      "tableau creator"
    ],
    "category": "analytics"
  },
  {
    "canonical": "PowerBI",
    "aliases": [
      "power bi",
      "power-bi",
      "dax formulas",
      "power query"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Mixpanel",
    "aliases": [
      "mixpanel analytics"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Amplitude",
    "aliases": [
      "amplitude analytics"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Google Analytics",
    "aliases": [
      "ga4",
      "google analytics 4",
      "universal analytics"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Snowflake",
    "aliases": [
      "snowflake dw",
      "snowflake data cloud",
      "snowpark"
    ],
    "category": "analytics"
  },
  {
    "canonical": "BigQuery",
    "aliases": [
      "google bigquery",
      "bq sql"
    ],
    "category": "analytics",
    "implies": [
      "Google Cloud"
    ]
  },
  {
    "canonical": "Redshift",
    "aliases": [
      "amazon redshift",
      "aws redshift"
    ],
    "category": "analytics",
    "implies": [
      "AWS"
    ]
  },
  {
    "canonical": "Databricks",
    "aliases": [
      "databricks lakehouse",
      "delta lake"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Apache Spark",
    "aliases": [
      "spark",
      "pyspark",
      "spark sql",
      "spark streaming"
    ],
    "category": "analytics"
  },
  {
    "canonical": "dbt",
    "aliases": [
      "data build tool",
      "dbt core",
      "dbt cloud"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Looker",
    "aliases": [
      "lookml",
      "looker studio",
      "google looker"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Metabase",
    "aliases": [
      "metabase bi",
      "metabase reporting"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Airflow",
    "aliases": [
      "apache airflow",
      "airflow dags"
    ],
    "category": "analytics"
  },
  {
    "canonical": "ETL",
    "aliases": [
      "elt",
      "extract transform load",
      "data ingestion",
      "data pipelines"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Data Modeling",
    "aliases": [
      "dimensional modeling",
      "star schema",
      "snowflake schema",
      "data vault"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Cohort Analysis",
    "aliases": [
      "retention cohorts",
      "behavioral cohorting"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Funnel Analysis",
    "aliases": [
      "funnel conversion",
      "drop-off analysis",
      "conversion funnels"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Statistical Analysis",
    "aliases": [
      "hypothesis testing",
      "p-value",
      "regression analysis",
      "anova",
      "sample sizing"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Data Governance",
    "aliases": [
      "data catalog",
      "metadata management",
      "alation",
      "collibra"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Data Quality",
    "aliases": [
      "great expectations",
      "data validation",
      "soda core",
      "monte carlo"
    ],
    "category": "analytics"
  },
  {
    "canonical": "ClickHouse",
    "aliases": [
      "clickhouse db",
      "columnar database"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Presto",
    "aliases": [
      "presto query",
      "trino",
      "athena"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Apache Hive",
    "aliases": [
      "hive query",
      "hive metastore"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Apache Hadoop",
    "aliases": [
      "hdfs",
      "mapreduce"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Apache Flink",
    "aliases": [
      "flink streaming",
      "stateful stream processing"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Kafka Streams",
    "aliases": [
      "kstreams",
      "kafka connect"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Segment",
    "aliases": [
      "segment.io",
      "customer data platform",
      "cdp",
      "rudderstack"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Data Lake",
    "aliases": [
      "data lakehouse",
      "apache iceberg",
      "apache hudi"
    ],
    "category": "analytics"
  },
  {
    "canonical": "CDC",
    "aliases": [
      "change data capture",
      "debezium"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Fivetran",
    "aliases": [
      "fivetran etl",
      "airbyte",
      "stitch data"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Business Intelligence",
    "aliases": [
      "bi",
      "bi reporting",
      "executive dashboards",
      "kpi reporting"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Data Storytelling",
    "aliases": [
      "data visualization",
      "executive data presentations"
    ],
    "category": "analytics"
  },
  {
    "canonical": "A/B Testing Analytics",
    "aliases": [
      "experimentation analysis",
      "statistical significance testing",
      "cuped"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Customer Journey Analytics",
    "aliases": [
      "path analysis",
      "attribution reporting",
      "touchpoint analysis"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Predictive Analytics",
    "aliases": [
      "propensity modeling",
      "churn prediction models",
      "lifetime value forecasting"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Market Basket Analysis",
    "aliases": [
      "association rules",
      "apriori algorithm"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Customer Segmentation",
    "aliases": [
      "rfm analysis",
      "behavioral clustering",
      "persona segmentation"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Exploratory Data Analysis",
    "aliases": [
      "eda",
      "data profiling"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Data Warehousing",
    "aliases": [
      "edw",
      "enterprise data warehouse"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Matplotlib",
    "aliases": [
      "seaborn",
      "python plotting",
      "plotly"
    ],
    "category": "analytics"
  },
  {
    "canonical": "DuckDB",
    "aliases": [
      "duckdb database",
      "embedded analytical database"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Data Observability",
    "aliases": [
      "pipeline monitoring",
      "data downtime tracking"
    ],
    "category": "analytics"
  },
  {
    "canonical": "Product Management",
    "aliases": [
      "product manager",
      "pm",
      "product ownership",
      "digital product management"
    ],
    "category": "product"
  },
  {
    "canonical": "Product Strategy",
    "aliases": [
      "product vision",
      "product roadmap strategy",
      "strategic roadmapping"
    ],
    "category": "product"
  },
  {
    "canonical": "PRD",
    "aliases": [
      "prds",
      "product requirements document",
      "product spec",
      "product requirement doc",
      "prd authoring"
    ],
    "category": "product"
  },
  {
    "canonical": "Roadmap",
    "aliases": [
      "product roadmap",
      "roadmap prioritization",
      "quarterly roadmap"
    ],
    "category": "product"
  },
  {
    "canonical": "User Stories",
    "aliases": [
      "user story writing",
      "acceptance criteria"
    ],
    "category": "product"
  },
  {
    "canonical": "User Research",
    "aliases": [
      "user interviews",
      "usability testing",
      "ux research",
      "customer interviews"
    ],
    "category": "product"
  },
  {
    "canonical": "Wireframing",
    "aliases": [
      "wireframes",
      "mockups",
      "low-fidelity prototyping",
      "balsamiq"
    ],
    "category": "product"
  },
  {
    "canonical": "Figma",
    "aliases": [
      "figma design",
      "figjam"
    ],
    "category": "product"
  },
  {
    "canonical": "Feature Prioritization",
    "aliases": [
      "prioritization frameworks",
      "rice framework",
      "moscow method",
      "kano model"
    ],
    "category": "product"
  },
  {
    "canonical": "MVP",
    "aliases": [
      "minimum viable product",
      "pilot launch",
      "prototype validation"
    ],
    "category": "product"
  },
  {
    "canonical": "Customer Discovery",
    "aliases": [
      "voice of customer",
      "voc",
      "customer problem discovery"
    ],
    "category": "product"
  },
  {
    "canonical": "Agile",
    "aliases": [
      "agile methodology",
      "agile development",
      "agile sprints"
    ],
    "category": "product"
  },
  {
    "canonical": "Scrum",
    "aliases": [
      "scrum master",
      "daily standup",
      "sprint planning",
      "sprint retrospective"
    ],
    "category": "product"
  },
  {
    "canonical": "Jira",
    "aliases": [
      "atlassian jira",
      "jira software"
    ],
    "category": "product"
  },
  {
    "canonical": "Confluence",
    "aliases": [
      "atlassian confluence"
    ],
    "category": "product"
  },
  {
    "canonical": "Backlog Grooming",
    "aliases": [
      "backlog refinement",
      "sprint backlog"
    ],
    "category": "product"
  },
  {
    "canonical": "North Star Metric",
    "aliases": [
      "north star",
      "nsm",
      "input metrics"
    ],
    "category": "product"
  },
  {
    "canonical": "Product Sense",
    "aliases": [
      "product thinking",
      "product intuition",
      "user empathy"
    ],
    "category": "product"
  },
  {
    "canonical": "Stakeholder Management",
    "aliases": [
      "cross-functional alignment",
      "executive alignment",
      "managing up"
    ],
    "category": "product"
  },
  {
    "canonical": "Design Thinking",
    "aliases": [
      "human-centered design",
      "empathy mapping"
    ],
    "category": "product"
  },
  {
    "canonical": "Jobs to be Done",
    "aliases": [
      "jtbd",
      "customer jobs"
    ],
    "category": "product"
  },
  {
    "canonical": "Product Lifecycle Management",
    "aliases": [
      "plm",
      "product sunset",
      "end of life"
    ],
    "category": "product"
  },
  {
    "canonical": "B2B SaaS Product",
    "aliases": [
      "b2b saas",
      "saas",
      "enterprise b2b product",
      "saas product management"
    ],
    "category": "product"
  },
  {
    "canonical": "B2C Product",
    "aliases": [
      "consumer internet product",
      "mobile app product"
    ],
    "category": "product"
  },
  {
    "canonical": "Competitive Benchmarking",
    "aliases": [
      "feature teardown",
      "competitor teardown"
    ],
    "category": "product"
  },
  {
    "canonical": "Release Management",
    "aliases": [
      "release planning",
      "feature rollout",
      "feature flags"
    ],
    "category": "product"
  },
  {
    "canonical": "Information Architecture",
    "aliases": [
      "sitemap design",
      "navigation hierarchy"
    ],
    "category": "product"
  },
  {
    "canonical": "Interaction Design",
    "aliases": [
      "ixd",
      "micro-interactions"
    ],
    "category": "product"
  },
  {
    "canonical": "Design Systems",
    "aliases": [
      "component library",
      "design tokens",
      "storybook"
    ],
    "category": "product"
  },
  {
    "canonical": "Accessibility",
    "aliases": [
      "a11y",
      "wcag",
      "screen reader support"
    ],
    "category": "product"
  },
  {
    "canonical": "Heuristic Evaluation",
    "aliases": [
      "usability heuristics",
      "nielsen norman"
    ],
    "category": "product"
  },
  {
    "canonical": "Card Sorting",
    "aliases": [
      "tree testing",
      "information hierarchy testing"
    ],
    "category": "product"
  },
  {
    "canonical": "Feature Flagging",
    "aliases": [
      "launchdarkly",
      "split.io",
      "feature toggle"
    ],
    "category": "product"
  },
  {
    "canonical": "Product Analytics",
    "aliases": [
      "event instrumentation",
      "tracking plan",
      "telemetry design"
    ],
    "category": "product"
  },
  {
    "canonical": "User Journey Mapping",
    "aliases": [
      "customer journey map",
      "journey mapping",
      "experience mapping"
    ],
    "category": "product"
  },
  {
    "canonical": "Product Discovery",
    "aliases": [
      "continuous discovery habits",
      "opportunity solution tree"
    ],
    "category": "product"
  },
  {
    "canonical": "Prototyping",
    "aliases": [
      "high-fidelity prototyping",
      "clickable prototype",
      "invision"
    ],
    "category": "product"
  },
  {
    "canonical": "Design Sprint",
    "aliases": [
      "google design sprint",
      "5-day design sprint"
    ],
    "category": "product"
  },
  {
    "canonical": "Beta Testing",
    "aliases": [
      "dogfooding",
      "beta program management",
      "early adopter feedback"
    ],
    "category": "product"
  },
  {
    "canonical": "Technical Product Management",
    "aliases": [
      "tpm",
      "api product management",
      "platform product manager"
    ],
    "category": "product"
  },
  {
    "canonical": "Mobile Product Management",
    "aliases": [
      "app store optimization pm",
      "mobile first product"
    ],
    "category": "product"
  },
  {
    "canonical": "Growth Product Management",
    "aliases": [
      "growth pm",
      "experimentation pm"
    ],
    "category": "product"
  },
  {
    "canonical": "Marketplace Product Management",
    "aliases": [
      "two-sided marketplace",
      "liquidity optimization",
      "matching algorithm pm"
    ],
    "category": "product"
  },
  {
    "canonical": "Fintech Product Management",
    "aliases": [
      "payment gateway pm",
      "neobanking pm",
      "lending product manager"
    ],
    "category": "product"
  },
  {
    "canonical": "User Persona",
    "aliases": [
      "buyer persona",
      "user archetype"
    ],
    "category": "product"
  },
  {
    "canonical": "Product OKRs",
    "aliases": [
      "product objectives",
      "key results setting"
    ],
    "category": "product"
  },
  {
    "canonical": "Customer Feedback Loops",
    "aliases": [
      "canny",
      "productboard",
      "feature request tracking"
    ],
    "category": "product"
  },
  {
    "canonical": "Product Operations",
    "aliases": [
      "product ops",
      "product cadence",
      "launch readiness"
    ],
    "category": "product"
  },
  {
    "canonical": "Service Blueprinting",
    "aliases": [
      "frontstage backstage mapping"
    ],
    "category": "product"
  },
  {
    "canonical": "UX Copywriting",
    "aliases": [
      "microcopy",
      "in-product copy"
    ],
    "category": "product"
  },
  {
    "canonical": "A/B Testing",
    "aliases": [
      "ab testing",
      "split testing",
      "experimentation",
      "bucket testing",
      "multivariate testing"
    ],
    "category": "growth"
  },
  {
    "canonical": "Growth Strategy",
    "aliases": [
      "growth marketing",
      "growth loops",
      "viral growth",
      "product-led growth",
      "plg"
    ],
    "category": "growth"
  },
  {
    "canonical": "Onboarding",
    "aliases": [
      "user onboarding",
      "activation flow",
      "time to value",
      "ttv"
    ],
    "category": "growth"
  },
  {
    "canonical": "Activation",
    "aliases": [
      "activation rate",
      "user activation",
      "aha moment"
    ],
    "category": "growth"
  },
  {
    "canonical": "Retention",
    "aliases": [
      "retention rate",
      "user retention",
      "d1/d7/d30 retention",
      "cohort retention"
    ],
    "category": "growth"
  },
  {
    "canonical": "Churn Prevention",
    "aliases": [
      "churn rate",
      "churn reduction",
      "customer churn",
      "attrition mitigation"
    ],
    "category": "growth"
  },
  {
    "canonical": "Conversion Rate Optimization",
    "aliases": [
      "cro",
      "conversion optimization",
      "landing page optimization"
    ],
    "category": "growth"
  },
  {
    "canonical": "Referral Loops",
    "aliases": [
      "referral program",
      "viral loops",
      "k-factor",
      "invitation mechanics"
    ],
    "category": "growth"
  },
  {
    "canonical": "Lifecycle Marketing",
    "aliases": [
      "crm marketing",
      "drip campaigns",
      "push notification strategy",
      "user re-engagement"
    ],
    "category": "growth"
  },
  {
    "canonical": "Monetization",
    "aliases": [
      "paywall optimization",
      "freemium conversion",
      "pricing tiers",
      "in-app purchases"
    ],
    "category": "growth"
  },
  {
    "canonical": "Customer Acquisition Cost",
    "aliases": [
      "cac",
      "blended cac",
      "paid cac"
    ],
    "category": "growth"
  },
  {
    "canonical": "Customer Lifetime Value",
    "aliases": [
      "ltv",
      "cltv",
      "clv",
      "ltv:cac ratio"
    ],
    "category": "growth"
  },
  {
    "canonical": "Gamification",
    "aliases": [
      "streaks",
      "badges",
      "rewards program",
      "loyalty mechanics"
    ],
    "category": "growth"
  },
  {
    "canonical": "Optimizely",
    "aliases": [
      "optimizely platform"
    ],
    "category": "growth"
  },
  {
    "canonical": "VWO",
    "aliases": [
      "visual website optimizer"
    ],
    "category": "growth"
  },
  {
    "canonical": "Push Notifications",
    "aliases": [
      "apns",
      "fcm",
      "clevertap",
      "moengage",
      "braze"
    ],
    "category": "growth"
  },
  {
    "canonical": "In-App Messaging",
    "aliases": [
      "in-app nudges",
      "intercom",
      "userflow",
      "appcues"
    ],
    "category": "growth"
  },
  {
    "canonical": "SMS Marketing",
    "aliases": [
      "transactional sms",
      "promotional sms",
      "twillio sms"
    ],
    "category": "growth"
  },
  {
    "canonical": "Lead Scoring",
    "aliases": [
      "mql",
      "sql qualification",
      "predictive lead scoring"
    ],
    "category": "growth"
  },
  {
    "canonical": "Growth Hacking",
    "aliases": [
      "viral marketing",
      "scrappy marketing experiments"
    ],
    "category": "growth"
  },
  {
    "canonical": "Search Engine Optimization",
    "aliases": [
      "seo",
      "technical seo",
      "on-page seo",
      "backlink strategy"
    ],
    "category": "growth"
  },
  {
    "canonical": "Search Engine Marketing",
    "aliases": [
      "sem",
      "google ads",
      "paid search",
      "adwords"
    ],
    "category": "growth"
  },
  {
    "canonical": "Pay-Per-Click",
    "aliases": [
      "ppc",
      "cpc bidding",
      "paid advertising"
    ],
    "category": "growth"
  },
  {
    "canonical": "Performance Marketing",
    "aliases": [
      "paid social",
      "facebook ads",
      "meta ads",
      "instagram ads",
      "linkedin ads"
    ],
    "category": "growth"
  },
  {
    "canonical": "Attribution Modeling",
    "aliases": [
      "multi-touch attribution",
      "mta",
      "last-click attribution",
      "marketing mix modeling",
      "mmm"
    ],
    "category": "growth"
  },
  {
    "canonical": "App Store Optimization",
    "aliases": [
      "aso",
      "app store keyword ranking",
      "apple search ads"
    ],
    "category": "growth"
  },
  {
    "canonical": "Flywheel Model",
    "aliases": [
      "growth flywheel",
      "growth compounding"
    ],
    "category": "growth"
  },
  {
    "canonical": "Paywall Testing",
    "aliases": [
      "pricing page a/b testing",
      "subscription checkout optimization"
    ],
    "category": "growth"
  },
  {
    "canonical": "Winback Campaigns",
    "aliases": [
      "re-engagement emails",
      "lapsed user reactivation"
    ],
    "category": "growth"
  },
  {
    "canonical": "Customer Onboarding Tours",
    "aliases": [
      "guided product walkthrough",
      "feature spotlight"
    ],
    "category": "growth"
  },
  {
    "canonical": "Virality Engineering",
    "aliases": [
      "viral coefficient",
      "word of mouth loops"
    ],
    "category": "growth"
  },
  {
    "canonical": "Email Deliverability",
    "aliases": [
      "dkim",
      "spf",
      "dmarc",
      "sender reputation"
    ],
    "category": "growth"
  },
  {
    "canonical": "Webinar Marketing",
    "aliases": [
      "live demo marketing",
      "demio"
    ],
    "category": "growth"
  },
  {
    "canonical": "Content Distribution",
    "aliases": [
      "syndication",
      "community seeding"
    ],
    "category": "growth"
  },
  {
    "canonical": "Affiliate Marketing",
    "aliases": [
      "affiliate network",
      "partner affiliate commissions"
    ],
    "category": "growth"
  },
  {
    "canonical": "Python",
    "aliases": [
      "python3",
      "python 3"
    ],
    "category": "engineering"
  },
  {
    "canonical": "JavaScript",
    "aliases": [
      "js",
      "ecmascript",
      "es6",
      "esnext"
    ],
    "category": "engineering"
  },
  {
    "canonical": "TypeScript",
    "aliases": [
      "ts"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Java",
    "aliases": [
      "core java",
      "java 11",
      "java 17",
      "java 21"
    ],
    "category": "engineering",
    "guarded": "java"
  },
  {
    "canonical": "C++",
    "aliases": [
      "cpp",
      "c plus plus",
      "c++17",
      "c++20"
    ],
    "category": "engineering"
  },
  {
    "canonical": "C#",
    "aliases": [
      "csharp",
      "c sharp",
      ".net c#"
    ],
    "category": "engineering"
  },
  {
    "canonical": "C",
    "aliases": [
      "c language",
      "c programming",
      "ansi c"
    ],
    "category": "engineering",
    "guarded": "c"
  },
  {
    "canonical": "Go",
    "aliases": [
      "golang"
    ],
    "category": "engineering",
    "guarded": "go"
  },
  {
    "canonical": "Rust",
    "aliases": [
      "rust lang",
      "rust language"
    ],
    "category": "engineering",
    "guarded": "rust"
  },
  {
    "canonical": "Ruby",
    "aliases": [
      "ruby lang",
      "ruby language"
    ],
    "category": "engineering",
    "guarded": "ruby"
  },
  {
    "canonical": "PHP",
    "aliases": [
      "php7",
      "php8"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Swift",
    "aliases": [
      "swift language",
      "apple swift"
    ],
    "category": "engineering",
    "guarded": "swift"
  },
  {
    "canonical": "Kotlin",
    "aliases": [
      "kotlin android"
    ],
    "category": "engineering"
  },
  {
    "canonical": "R",
    "aliases": [
      "r programming",
      "r language",
      "r-project"
    ],
    "category": "engineering",
    "guarded": "r"
  },
  {
    "canonical": "Scala",
    "aliases": [
      "scala lang"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Dart",
    "aliases": [
      "dart lang"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Shell Scripting",
    "aliases": [
      "bash",
      "shell script",
      "zsh",
      "powershell"
    ],
    "category": "engineering"
  },
  {
    "canonical": "HTML/CSS",
    "aliases": [
      "html",
      "html5",
      "css",
      "css3",
      "sass",
      "scss",
      "tailwind css",
      "tailwind"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Solidity",
    "aliases": [
      "smart contracts",
      "ethereum development",
      "evm"
    ],
    "category": "engineering"
  },
  {
    "canonical": "WebAssembly",
    "aliases": [
      "wasm"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Haskell",
    "aliases": [
      "haskell functional"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Elixir",
    "aliases": [
      "erlang",
      "phoenix framework"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Clojure",
    "aliases": [
      "clojurescript"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Perl",
    "aliases": [
      "perl scripting"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Lua",
    "aliases": [
      "lua scripting"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Julia",
    "aliases": [
      "julia lang"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Groovy",
    "aliases": [
      "apache groovy"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Objective-C",
    "aliases": [
      "objc",
      "objective c"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Assembly",
    "aliases": [
      "assembly language",
      "x86 assembly",
      "arm assembly"
    ],
    "category": "engineering"
  },
  {
    "canonical": "F#",
    "aliases": [
      "fsharp"
    ],
    "category": "engineering"
  },
  {
    "canonical": "VHDL",
    "aliases": [
      "verilog",
      "fpga programming"
    ],
    "category": "engineering"
  },
  {
    "canonical": "COBOL",
    "aliases": [
      "cobol mainframe"
    ],
    "category": "engineering"
  },
  {
    "canonical": "MATLAB",
    "aliases": [
      "matlab programming",
      "simulink"
    ],
    "category": "engineering"
  },
  {
    "canonical": "ActionScript",
    "aliases": [
      "actionscript 3"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Fortran",
    "aliases": [
      "fortran scientific"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Node.js",
    "aliases": [
      "nodejs",
      "node js",
      "node runtime"
    ],
    "category": "engineering"
  },
  {
    "canonical": "React",
    "aliases": [
      "react.js",
      "reactjs"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Next.js",
    "aliases": [
      "nextjs",
      "next js"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Vue.js",
    "aliases": [
      "vue",
      "vuejs",
      "vue 3",
      "nuxt.js",
      "nuxtjs"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Angular",
    "aliases": [
      "angularjs",
      "angular 2+"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Express.js",
    "aliases": [
      "express",
      "expressjs"
    ],
    "category": "engineering"
  },
  {
    "canonical": "FastAPI",
    "aliases": [
      "fastapi framework"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Django",
    "aliases": [
      "django rest framework",
      "drf"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Flask",
    "aliases": [
      "flask microframework",
      "python flask"
    ],
    "category": "engineering",
    "guarded": "flask"
  },
  {
    "canonical": "Spring Boot",
    "aliases": [
      "spring framework",
      "spring-boot",
      "spring mvc",
      "spring security"
    ],
    "category": "engineering",
    "guarded": "spring"
  },
  {
    "canonical": "Ruby on Rails",
    "aliases": [
      "rails",
      "ror"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Flutter",
    "aliases": [
      "flutter sdk"
    ],
    "category": "engineering"
  },
  {
    "canonical": "React Native",
    "aliases": [
      "react-native"
    ],
    "category": "engineering"
  },
  {
    "canonical": ".NET",
    "aliases": [
      "dotnet",
      ".net core",
      "asp.net",
      "asp.net core"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Svelte",
    "aliases": [
      "sveltekit"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Redux",
    "aliases": [
      "redux toolkit",
      "rtk",
      "mobx",
      "zustand"
    ],
    "category": "engineering"
  },
  {
    "canonical": "RxJS",
    "aliases": [
      "reactive extensions",
      "reactive programming"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Webpack",
    "aliases": [
      "vite",
      "rollup",
      "esbuild"
    ],
    "category": "engineering"
  },
  {
    "canonical": "GraphQL",
    "aliases": [
      "graphql api",
      "apollo graphql",
      "relay graphql"
    ],
    "category": "engineering"
  },
  {
    "canonical": "gRPC",
    "aliases": [
      "protocol buffers",
      "protobuf"
    ],
    "category": "engineering"
  },
  {
    "canonical": "WebSockets",
    "aliases": [
      "websocket",
      "socket.io",
      "real-time messaging"
    ],
    "category": "engineering"
  },
  {
    "canonical": "REST API",
    "aliases": [
      "restful",
      "rest apis",
      "restful api",
      "rest api design",
      "api",
      "apis"
    ],
    "category": "engineering"
  },
  {
    "canonical": "NestJS",
    "aliases": [
      "nest.js",
      "nestjs framework"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Electron",
    "aliases": [
      "electron js"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Capacitor",
    "aliases": [
      "ionic framework",
      "cordova"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Tailwind CSS",
    "aliases": [
      "tailwindcss"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Bootstrap",
    "aliases": [
      "bootstrap css",
      "bootstrap 5"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Material UI",
    "aliases": [
      "mui",
      "shadcn",
      "ant design"
    ],
    "category": "engineering"
  },
  {
    "canonical": "jQuery",
    "aliases": [
      "jquery library"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Remix",
    "aliases": [
      "remix.run",
      "remix js"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Gatsby",
    "aliases": [
      "gatsbyjs"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Laravel",
    "aliases": [
      "laravel framework",
      "artisan"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Symfony",
    "aliases": [
      "symfony framework"
    ],
    "category": "engineering"
  },
  {
    "canonical": "ASP.NET MVC",
    "aliases": [
      "asp net mvc"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Hibernate",
    "aliases": [
      "jpa",
      "hibernate orm"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Prisma",
    "aliases": [
      "prisma orm",
      "drizzle orm",
      "typeorm"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Sequelize",
    "aliases": [
      "sequelize orm",
      "mongoose orm"
    ],
    "category": "engineering"
  },
  {
    "canonical": "iOS Development",
    "aliases": [
      "xcode",
      "uikit",
      "swiftui",
      "cocoapods"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Android Development",
    "aliases": [
      "android studio",
      "jetpack compose",
      "gradle android"
    ],
    "category": "engineering"
  },
  {
    "canonical": "WebRTC",
    "aliases": [
      "peer to peer audio video",
      "realtime communication"
    ],
    "category": "engineering"
  },
  {
    "canonical": "System Design",
    "aliases": [
      "software architecture",
      "high level design",
      "hld",
      "low level design",
      "lld"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Distributed Systems",
    "aliases": [
      "distributed computing",
      "consensus algorithms",
      "cap theorem",
      "paxos",
      "raft consensus"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Microservices",
    "aliases": [
      "microservice architecture",
      "service oriented architecture",
      "soa"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Data Structures",
    "aliases": [
      "dsa",
      "algorithms",
      "algorithmic problem solving"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Scalability",
    "aliases": [
      "high throughput",
      "low latency",
      "fault tolerance",
      "load balancing"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Docker",
    "aliases": [
      "docker container",
      "docker compose",
      "containerization"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Kubernetes",
    "aliases": [
      "k8s",
      "k8s orchestration",
      "kubectl"
    ],
    "category": "engineering"
  },
  {
    "canonical": "AWS",
    "aliases": [
      "amazon web services",
      "aws cloud"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Google Cloud",
    "aliases": [
      "gcp",
      "google cloud platform"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Azure",
    "aliases": [
      "microsoft azure",
      "azure cloud"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Terraform",
    "aliases": [
      "infrastructure as code",
      "iac",
      "hashicorp terraform"
    ],
    "category": "engineering"
  },
  {
    "canonical": "CI/CD",
    "aliases": [
      "continuous integration",
      "continuous delivery",
      "continuous deployment",
      "github actions",
      "gitlab ci",
      "jenkins"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Git",
    "aliases": [
      "github",
      "gitlab",
      "version control",
      "git workflows"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Linux",
    "aliases": [
      "unix",
      "ubuntu",
      "debian",
      "centos",
      "linux administration"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Redis",
    "aliases": [
      "redis cache",
      "in-memory caching"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Memcached",
    "aliases": [
      "memcached cache"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Apache Kafka",
    "aliases": [
      "kafka",
      "event-driven architecture",
      "message streaming",
      "pub-sub"
    ],
    "category": "engineering"
  },
  {
    "canonical": "RabbitMQ",
    "aliases": [
      "message queue",
      "amqp",
      "celery queue"
    ],
    "category": "engineering"
  },
  {
    "canonical": "MongoDB",
    "aliases": [
      "mongo",
      "document db"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Elasticsearch",
    "aliases": [
      "elastic search",
      "opensearch",
      "elk stack"
    ],
    "category": "engineering"
  },
  {
    "canonical": "DynamoDB",
    "aliases": [
      "amazon dynamodb"
    ],
    "category": "engineering",
    "implies": [
      "AWS",
      "NoSQL"
    ]
  },
  {
    "canonical": "Cassandra",
    "aliases": [
      "apache cassandra",
      "nosql column store"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Database Indexing",
    "aliases": [
      "query optimization",
      "explain plan",
      "database tuning",
      "btree indexes"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Cybersecurity",
    "aliases": [
      "information security",
      "appsec",
      "penetration testing",
      "oauth",
      "jwt",
      "saml",
      "sso"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Unit Testing",
    "aliases": [
      "automated testing",
      "jest",
      "pytest",
      "junit",
      "tdd",
      "integration testing"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Site Reliability Engineering",
    "aliases": [
      "sre",
      "observability",
      "datadog",
      "prometheus",
      "grafana",
      "incident management"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Ansible",
    "aliases": [
      "ansible automation",
      "ansible playbooks"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Puppet",
    "aliases": [
      "puppet config"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Helm",
    "aliases": [
      "helm charts",
      "k8s helm"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Vault",
    "aliases": [
      "hashicorp vault",
      "secrets management"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Consul",
    "aliases": [
      "hashicorp consul",
      "service discovery"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Nginx",
    "aliases": [
      "nginx web server",
      "reverse proxy"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Apache HTTP Server",
    "aliases": [
      "httpd",
      "apache server"
    ],
    "category": "engineering"
  },
  {
    "canonical": "HAProxy",
    "aliases": [
      "haproxy load balancer"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Envoy",
    "aliases": [
      "envoy proxy",
      "service mesh"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Istio",
    "aliases": [
      "istio service mesh"
    ],
    "category": "engineering"
  },
  {
    "canonical": "OpenSearch",
    "aliases": [
      "aws opensearch"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Neo4j",
    "aliases": [
      "graph database",
      "cypher query"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Couchbase",
    "aliases": [
      "couchbase server"
    ],
    "category": "engineering"
  },
  {
    "canonical": "SQLite",
    "aliases": [
      "sqlite3"
    ],
    "category": "engineering"
  },
  {
    "canonical": "MariaDB",
    "aliases": [
      "maria db"
    ],
    "category": "engineering",
    "implies": [
      "SQL"
    ]
  },
  {
    "canonical": "Oracle Database",
    "aliases": [
      "oracle db",
      "pl/sql"
    ],
    "category": "engineering",
    "implies": [
      "SQL"
    ]
  },
  {
    "canonical": "CockroachDB",
    "aliases": [
      "cockroach db",
      "distributed sql"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Cypress",
    "aliases": [
      "cypress testing",
      "e2e testing"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Playwright",
    "aliases": [
      "playwright automation"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Selenium",
    "aliases": [
      "selenium webdriver"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Postman",
    "aliases": [
      "postman api",
      "api testing",
      "newman"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Swagger",
    "aliases": [
      "openapi",
      "api documentation"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Splunk",
    "aliases": [
      "splunk enterprise",
      "splunk logs"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Sentry",
    "aliases": [
      "sentry error tracking"
    ],
    "category": "engineering"
  },
  {
    "canonical": "New Relic",
    "aliases": [
      "newrelic apm"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Serverless",
    "aliases": [
      "serverless framework",
      "event-driven compute",
      "faas"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Event Sourcing",
    "aliases": [
      "cqrs",
      "command query responsibility segregation"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Disaster Recovery",
    "aliases": [
      "high availability",
      "failover mechanism",
      "rpo rto"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Load Testing",
    "aliases": [
      "stress testing",
      "k6",
      "locust",
      "jmeter"
    ],
    "category": "engineering"
  },
  {
    "canonical": "Go-to-Market",
    "aliases": [
      "gtm",
      "go to market strategy",
      "gtm execution",
      "launch strategy"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Market Sizing",
    "aliases": [
      "tam sam som",
      "total addressable market",
      "market estimation"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Competitive Analysis",
    "aliases": [
      "competitor analysis",
      "competitive intelligence",
      "battlecards"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Business Case",
    "aliases": [
      "business case development",
      "feasibility study"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Strategic Planning",
    "aliases": [
      "corporate strategy",
      "long range planning",
      "annual planning"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Consulting Frameworks",
    "aliases": [
      "mece",
      "issue tree",
      "hypothesis-driven approach",
      "mckinsey frameworks"
    ],
    "category": "strategy"
  },
  {
    "canonical": "SWOT Analysis",
    "aliases": [
      "swot",
      "pestle analysis"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Due Diligence",
    "aliases": [
      "commercial due diligence",
      "technical due diligence"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Mergers & Acquisitions",
    "aliases": [
      "m&a",
      "post-merger integration",
      "pmi"
    ],
    "category": "strategy"
  },
  {
    "canonical": "International Expansion",
    "aliases": [
      "market entry",
      "localization strategy",
      "cross-border expansion"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Partnership Strategy",
    "aliases": [
      "strategic alliances",
      "ecosystem partnerships",
      "channel strategy"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Pricing Strategy",
    "aliases": [
      "pricing models",
      "value-based pricing",
      "packaging strategy"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Financial Modeling",
    "aliases": [
      "three-statement model",
      "financial forecasting",
      "pro-forma"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Unit Economics",
    "aliases": [
      "contribution margin",
      "gross margin",
      "payback period"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "P&L Management",
    "aliases": [
      "profit and loss",
      "p&l ownership",
      "income statement"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "DCF",
    "aliases": [
      "discounted cash flow",
      "wacc"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Valuation",
    "aliases": [
      "company valuation",
      "comparable company analysis",
      "comps"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Budgeting & Forecasting",
    "aliases": [
      "annual budgeting",
      "fp&a",
      "opex forecasting",
      "capex"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "ROI",
    "aliases": [
      "return on investment",
      "roi calculation"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Cost Optimization",
    "aliases": [
      "burn reduction",
      "runway extension",
      "cloud cost optimization",
      "finops"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "BizOps",
    "aliases": [
      "business operations",
      "business ops",
      "operational excellence"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Founder's Office",
    "aliases": [
      "founders office",
      "chief of staff",
      "ceo office",
      "special projects"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Executive Presentation",
    "aliases": [
      "board deck",
      "investor pitch deck",
      "c-suite storytelling"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Fundraising",
    "aliases": [
      "venture capital",
      "series a",
      "series b",
      "cap table",
      "term sheets"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Zero-to-One",
    "aliases": [
      "0-to-1 product",
      "early stage building",
      "greenfield project"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Cross-Border Payments",
    "aliases": [
      "international remittances",
      "swift network",
      "fx hedging"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Scenario Planning",
    "aliases": [
      "sensitivity analysis",
      "monte carlo financial"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Venture Debt",
    "aliases": [
      "working capital financing",
      "debt restructuring"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Cap Table Management",
    "aliases": [
      "carta",
      "equity dilution modeling"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Investor Relations",
    "aliases": [
      "quarterly investor updates",
      "shareholder communications"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Corporate Development",
    "aliases": [
      "corp dev",
      "strategic investments"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Revenue Operations",
    "aliases": [
      "revops",
      "sales forecasting",
      "quota setting"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Organizational Design",
    "aliases": [
      "org restructuring",
      "headcount planning"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Change Management",
    "aliases": [
      "kotter model",
      "stakeholder transition"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Benchmarking",
    "aliases": [
      "industry benchmarks",
      "peer comparison"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Digital Transformation",
    "aliases": [
      "legacy modernization",
      "cloud migration strategy"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Commercial Due Diligence",
    "aliases": [
      "cdd",
      "market due diligence"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Value Proposition Design",
    "aliases": [
      "value prop canvas",
      "customer job mapping"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Strategic Sourcing",
    "aliases": [
      "supplier negotiations",
      "global procurement strategy"
    ],
    "category": "strategy"
  },
  {
    "canonical": "Venture Building",
    "aliases": [
      "corporate incubator",
      "startup studio"
    ],
    "category": "strategy"
  },
  {
    "canonical": "SaaS Metrics",
    "aliases": [
      "arr",
      "mrr",
      "net revenue retention",
      "nrr",
      "gross revenue retention",
      "rule of 40"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Working Capital Management",
    "aliases": [
      "cash conversion cycle",
      "accounts receivable management"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Treasury Management",
    "aliases": [
      "cash management",
      "liquidity management"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Tax Planning",
    "aliases": [
      "transfer pricing",
      "corporate tax structuring"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Audit Readiness",
    "aliases": [
      "statutory audit",
      "internal controls"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Content Marketing",
    "aliases": [
      "content strategy",
      "blogging strategy",
      "editorial calendar"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Email Marketing",
    "aliases": [
      "newsletter marketing",
      "mailchimp",
      "klaviyo",
      "hubspot email"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Social Media Marketing",
    "aliases": [
      "smm",
      "organic social",
      "community management"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Brand Strategy",
    "aliases": [
      "brand positioning",
      "brand awareness",
      "brand narrative"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Copywriting",
    "aliases": [
      "ad copywriting",
      "landing page copy",
      "conversion copy"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Public Relations",
    "aliases": [
      "pr",
      "press release",
      "media relations"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Influencer Marketing",
    "aliases": [
      "creator marketing",
      "influencer partnerships"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Product Marketing",
    "aliases": [
      "pmm",
      "product launch campaign",
      "sales enablement collateral"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Account-Based Marketing",
    "aliases": [
      "abm",
      "target account strategy",
      "demandbase"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Customer Advocacy",
    "aliases": [
      "case study creation",
      "customer testimonials"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Event Marketing",
    "aliases": [
      "trade show management",
      "user conferences"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Community Building",
    "aliases": [
      "slack community",
      "discord community",
      "developer relations",
      "devrel"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Video Marketing",
    "aliases": [
      "youtube seo",
      "video production",
      "tiktok marketing"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Podcast Production",
    "aliases": [
      "audio branding",
      "guest pitching"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Market Research",
    "aliases": [
      "survey design",
      "focus groups",
      "nielsen research"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Enterprise Sales",
    "aliases": [
      "b2b sales",
      "solution selling",
      "complex sales cycles",
      "meddic"
    ],
    "category": "sales"
  },
  {
    "canonical": "Lead Generation",
    "aliases": [
      "inbound leads",
      "outbound prospecting",
      "lead qualification",
      "bdr"
    ],
    "category": "sales"
  },
  {
    "canonical": "Cold Outreach",
    "aliases": [
      "cold emailing",
      "cold calling",
      "outreach cadences",
      "apollo.io"
    ],
    "category": "sales"
  },
  {
    "canonical": "Salesforce",
    "aliases": [
      "sfdc",
      "salesforce crm",
      "salesforce admin"
    ],
    "category": "sales"
  },
  {
    "canonical": "HubSpot",
    "aliases": [
      "hubspot crm",
      "hubspot sales hub"
    ],
    "category": "sales"
  },
  {
    "canonical": "Sales Pipeline Management",
    "aliases": [
      "deal pipeline",
      "pipeline velocity",
      "deal closing"
    ],
    "category": "sales"
  },
  {
    "canonical": "Account Management",
    "aliases": [
      "client relationship management",
      "upselling",
      "account renewal",
      "cross-selling"
    ],
    "category": "sales"
  },
  {
    "canonical": "Customer Success",
    "aliases": [
      "cs",
      "csat",
      "nps",
      "client onboarding",
      "gainsight"
    ],
    "category": "sales"
  },
  {
    "canonical": "Contract Negotiation",
    "aliases": [
      "msa",
      "sow negotiation",
      "procurement negotiations"
    ],
    "category": "sales"
  },
  {
    "canonical": "RFP Response",
    "aliases": [
      "request for proposal",
      "vendor tender",
      "rfi"
    ],
    "category": "sales"
  },
  {
    "canonical": "Channel Sales",
    "aliases": [
      "reseller network",
      "system integrator partnerships"
    ],
    "category": "sales"
  },
  {
    "canonical": "Inside Sales",
    "aliases": [
      "sales development representative",
      "sdr",
      "sales closing"
    ],
    "category": "sales"
  },
  {
    "canonical": "Sales Enablement",
    "aliases": [
      "sales playbooks",
      "objection handling",
      "highspot"
    ],
    "category": "sales"
  },
  {
    "canonical": "Sales Forecasting",
    "aliases": [
      "weighted pipeline",
      "commit forecasting"
    ],
    "category": "sales"
  },
  {
    "canonical": "Key Account Management",
    "aliases": [
      "kam",
      "tier 1 client management"
    ],
    "category": "sales"
  },
  {
    "canonical": "Consultative Selling",
    "aliases": [
      "challenger sale",
      "spin selling"
    ],
    "category": "sales"
  },
  {
    "canonical": "Territory Planning",
    "aliases": [
      "sales quota allocation",
      "geographic territory planning"
    ],
    "category": "sales"
  },
  {
    "canonical": "Inbound Marketing",
    "aliases": [
      "lead magnet creation",
      "content gated leads"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Outbound Sales",
    "aliases": [
      "prospecting tools",
      "zoominfo",
      "lusha"
    ],
    "category": "sales"
  },
  {
    "canonical": "Competitive Win-Loss Analysis",
    "aliases": [
      "sales loss reviews",
      "buyer interviews"
    ],
    "category": "sales"
  },
  {
    "canonical": "Pitch Deck Creation",
    "aliases": [
      "client pitch deck",
      "commercial presentation"
    ],
    "category": "sales"
  },
  {
    "canonical": "Sales Demo",
    "aliases": [
      "product demonstration",
      "proof of concept sales",
      "poc"
    ],
    "category": "sales"
  },
  {
    "canonical": "Customer Retention Strategy",
    "aliases": [
      "churn intervention",
      "executive business review",
      "ebr"
    ],
    "category": "sales"
  },
  {
    "canonical": "Co-Marketing",
    "aliases": [
      "partner joint webinars",
      "joint whitepapers"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Field Marketing",
    "aliases": [
      "regional marketing events",
      "executive dinners"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Media Buying",
    "aliases": [
      "programmatic ads",
      "dsp",
      "ssp"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Creative Direction",
    "aliases": [
      "creative briefs",
      "ad creative testing"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Customer Advocacy Programs",
    "aliases": [
      "referenceable customers",
      "g2 reviews management"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Viral Marketing",
    "aliases": [
      "guerrilla marketing",
      "earned media"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Brand Identity",
    "aliases": [
      "brand guidelines",
      "visual identity system"
    ],
    "category": "marketing"
  },
  {
    "canonical": "Operations Management",
    "aliases": [
      "operations",
      "ops",
      "day-to-day operations"
    ],
    "category": "operations"
  },
  {
    "canonical": "Supply Chain",
    "aliases": [
      "supply chain management",
      "scm",
      "inventory management",
      "warehouse management"
    ],
    "category": "operations"
  },
  {
    "canonical": "Logistics",
    "aliases": [
      "last mile delivery",
      "fleet management",
      "dispatch optimization",
      "middle mile logistics"
    ],
    "category": "operations"
  },
  {
    "canonical": "Vendor Management",
    "aliases": [
      "vendor evaluation",
      "sla negotiation",
      "supplier management",
      "vendor contracts"
    ],
    "category": "operations"
  },
  {
    "canonical": "SLA Management",
    "aliases": [
      "service level agreement",
      "sla tracking",
      "turnaround time optimization",
      "tat"
    ],
    "category": "operations"
  },
  {
    "canonical": "SOP Authoring",
    "aliases": [
      "standard operating procedures",
      "sop creation",
      "process documentation"
    ],
    "category": "operations"
  },
  {
    "canonical": "Process Improvement",
    "aliases": [
      "six sigma",
      "lean manufacturing",
      "kaizen",
      "workflow automation"
    ],
    "category": "operations"
  },
  {
    "canonical": "Talent Acquisition",
    "aliases": [
      "recruiting",
      "technical recruiting",
      "sourcing candidates",
      "hiring"
    ],
    "category": "operations"
  },
  {
    "canonical": "Employee Relations",
    "aliases": [
      "hr operations",
      "people operations",
      "people ops"
    ],
    "category": "operations"
  },
  {
    "canonical": "Performance Management",
    "aliases": [
      "performance review",
      "okrs",
      "kpiss",
      "kpis"
    ],
    "category": "operations"
  },
  {
    "canonical": "Compensation & Benefits",
    "aliases": [
      "c&b",
      "payroll administration",
      "equity compensation",
      "esops"
    ],
    "category": "operations"
  },
  {
    "canonical": "Regulatory Compliance",
    "aliases": [
      "statutory compliance",
      "legal compliance",
      "iso certification"
    ],
    "category": "operations"
  },
  {
    "canonical": "Fintech Compliance",
    "aliases": [
      "kyc",
      "aml",
      "anti-money laundering",
      "rbi compliance"
    ],
    "category": "operations"
  },
  {
    "canonical": "Merchant Onboarding",
    "aliases": [
      "kyb",
      "merchant underwriting",
      "merchant acquiring"
    ],
    "category": "operations"
  },
  {
    "canonical": "Dark Store Operations",
    "aliases": [
      "quick commerce ops",
      "micro-fulfillment",
      "picker efficiency"
    ],
    "category": "operations"
  },
  {
    "canonical": "Fleet Optimization",
    "aliases": [
      "route planning",
      "driver allocation algorithms"
    ],
    "category": "operations"
  },
  {
    "canonical": "Inventory Forecasting",
    "aliases": [
      "stockout prevention",
      "reorder point modeling",
      "safety stock"
    ],
    "category": "operations"
  },
  {
    "canonical": "Procurement",
    "aliases": [
      "direct procurement",
      "indirect procurement",
      "rfq management"
    ],
    "category": "operations"
  },
  {
    "canonical": "Third-Party Logistics",
    "aliases": [
      "3pl",
      "freight forwarding"
    ],
    "category": "operations"
  },
  {
    "canonical": "Quality Assurance Ops",
    "aliases": [
      "qa ops",
      "total quality management",
      "tqm"
    ],
    "category": "operations"
  },
  {
    "canonical": "Customer Support Operations",
    "aliases": [
      "support queue management",
      "zendesk",
      "freshdesk",
      "first response time"
    ],
    "category": "operations"
  },
  {
    "canonical": "Workforce Management",
    "aliases": [
      "shift scheduling",
      "agent capacity planning"
    ],
    "category": "operations"
  },
  {
    "canonical": "Warehouse Management Systems",
    "aliases": [
      "wms",
      "barcode scanning",
      "inventory reconciliation"
    ],
    "category": "operations"
  },
  {
    "canonical": "Reverse Logistics",
    "aliases": [
      "returns management",
      "rma processing",
      "refurbishment"
    ],
    "category": "operations"
  },
  {
    "canonical": "Cold Chain Logistics",
    "aliases": [
      "temperature controlled supply chain"
    ],
    "category": "operations"
  },
  {
    "canonical": "Contract Management",
    "aliases": [
      "contract lifecycle management",
      "clm"
    ],
    "category": "operations"
  },
  {
    "canonical": "Facility Management",
    "aliases": [
      "office operations",
      "workplace services"
    ],
    "category": "operations"
  },
  {
    "canonical": "Occupational Safety",
    "aliases": [
      "osha compliance",
      "workplace safety protocols"
    ],
    "category": "operations"
  },
  {
    "canonical": "HRIS",
    "aliases": [
      "human resources information system",
      "workday",
      "bamboohr",
      "darwinbox"
    ],
    "category": "operations"
  },
  {
    "canonical": "Employer Branding",
    "aliases": [
      "campus recruitment",
      "glassdoor management"
    ],
    "category": "operations"
  },
  {
    "canonical": "Diversity & Inclusion",
    "aliases": [
      "de&i",
      "diversity initiatives"
    ],
    "category": "operations"
  },
  {
    "canonical": "Training & Development",
    "aliases": [
      "l&d",
      "employee upskilling",
      "learning management system",
      "lms"
    ],
    "category": "operations"
  },
  {
    "canonical": "Succession Planning",
    "aliases": [
      "leadership pipeline development"
    ],
    "category": "operations"
  },
  {
    "canonical": "Vendor Sourcing",
    "aliases": [
      "supplier selection",
      "e-auctions"
    ],
    "category": "operations"
  },
  {
    "canonical": "Risk Management",
    "aliases": [
      "operational risk",
      "enterprise risk management",
      "erm"
    ],
    "category": "operations"
  },
  {
    "canonical": "Business Continuity Planning",
    "aliases": [
      "bcp",
      "disaster recovery planning"
    ],
    "category": "operations"
  },
  {
    "canonical": "Fraud Operations",
    "aliases": [
      "fraud investigation",
      "chargeback management"
    ],
    "category": "operations"
  },
  {
    "canonical": "Dispute Resolution",
    "aliases": [
      "arbitration",
      "merchant mediation"
    ],
    "category": "operations"
  },
  {
    "canonical": "Field Operations",
    "aliases": [
      "ground team management",
      "field inspections"
    ],
    "category": "operations"
  },
  {
    "canonical": "Cross-Docking",
    "aliases": [
      "hub and spoke logistics"
    ],
    "category": "operations"
  },
  {
    "canonical": "Drop Shipping",
    "aliases": [
      "direct to consumer fulfillment",
      "d2c logistics"
    ],
    "category": "operations"
  },
  {
    "canonical": "Root Cause Analysis",
    "aliases": [
      "5 whys",
      "fishbone diagram"
    ],
    "category": "operations"
  },
  {
    "canonical": "Capacity Planning",
    "aliases": [
      "resource allocation",
      "utilization optimization"
    ],
    "category": "operations"
  },
  {
    "canonical": "Vendor Audit",
    "aliases": [
      "factory audits",
      "supplier compliance auditing"
    ],
    "category": "operations"
  },
  {
    "canonical": "Process Mapping",
    "aliases": [
      "value stream mapping",
      "swimlane diagrams"
    ],
    "category": "operations"
  },
  {
    "canonical": "AWS Lambda",
    "aliases": [
      "amazon lambda",
      "lambda function"
    ],
    "category": "engineering",
    "implies": [
      "AWS",
      "Serverless"
    ]
  },
  {
    "canonical": "Amazon S3",
    "aliases": [
      "aws s3",
      "simple storage service",
      "s3 bucket"
    ],
    "category": "engineering",
    "implies": [
      "AWS"
    ]
  },
  {
    "canonical": "Amazon EC2",
    "aliases": [
      "aws ec2",
      "elastic compute cloud",
      "ec2 instance"
    ],
    "category": "engineering",
    "implies": [
      "AWS"
    ]
  },
  {
    "canonical": "Amazon RDS",
    "aliases": [
      "aws rds",
      "relational database service"
    ],
    "category": "engineering",
    "implies": [
      "AWS"
    ]
  },
  {
    "canonical": "Amazon ECS",
    "aliases": [
      "aws ecs",
      "elastic container service"
    ],
    "category": "engineering",
    "implies": [
      "AWS"
    ]
  },
  {
    "canonical": "Amazon EKS",
    "aliases": [
      "aws eks",
      "elastic kubernetes service"
    ],
    "category": "engineering",
    "implies": [
      "AWS",
      "Kubernetes"
    ]
  },
  {
    "canonical": "AWS CloudFormation",
    "aliases": [
      "cloudformation",
      "aws cfn"
    ],
    "category": "engineering",
    "implies": [
      "AWS",
      "Infrastructure as Code"
    ]
  },
  {
    "canonical": "Google Kubernetes Engine",
    "aliases": [
      "gke",
      "google gke"
    ],
    "category": "engineering",
    "implies": [
      "Google Cloud",
      "Kubernetes"
    ]
  },
  {
    "canonical": "Google Cloud Run",
    "aliases": [
      "cloud run",
      "gcp cloud run"
    ],
    "category": "engineering",
    "implies": [
      "Google Cloud",
      "Serverless"
    ]
  },
  {
    "canonical": "Google Cloud Functions",
    "aliases": [
      "cloud functions",
      "gcp cloud functions"
    ],
    "category": "engineering",
    "implies": [
      "Google Cloud",
      "Serverless"
    ]
  },
  {
    "canonical": "Azure DevOps",
    "aliases": [
      "vsts",
      "azure pipelines"
    ],
    "category": "engineering",
    "implies": [
      "Azure",
      "CI/CD"
    ]
  },
  {
    "canonical": "Azure Kubernetes Service",
    "aliases": [
      "azure aks",
      "aks cluster"
    ],
    "category": "engineering",
    "implies": [
      "Azure",
      "Kubernetes"
    ]
  },
  {
    "canonical": "Google Colab",
    "aliases": [
      "colab notebook",
      "google colaboratory"
    ],
    "category": "ai_ml",
    "implies": [
      "Jupyter"
    ]
  },
  {
    "canonical": "Business Development",
    "aliases": [
      "bizdev",
      "b2b partnerships",
      "commercial partnerships"
    ],
    "category": "sales"
  },
  {
    "canonical": "HR Analytics",
    "aliases": [
      "people analytics",
      "workforce analytics"
    ],
    "category": "operations"
  },
  {
    "canonical": "HR Compliance",
    "aliases": [
      "labor compliance",
      "employment law compliance"
    ],
    "category": "operations"
  },
  {
    "canonical": "Accounting",
    "aliases": [
      "general ledger",
      "gaap",
      "statutory accounting"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "Financial Reporting",
    "aliases": [
      "financial statements",
      "management reporting",
      "mis reporting"
    ],
    "category": "finance_bizops"
  },
  {
    "canonical": "vLLM",
    "aliases": [
      "vllm inference",
      "pagedattention"
    ],
    "category": "ai_ml"
  },
  {
    "canonical": "Ollama",
    "aliases": [
      "ollama runtime",
      "ollama llm"
    ],
    "category": "ai_ml"
  }
];

  const CONTEXT_WORDS = /\b(?:software|developer|engineer|programming|code|embedded|firmware|systems|kernel)\b/i;

  const GUARDED_MATCHERS = {
    // Plain C: must be case-sensitive 'C', not preceded by letter or followed by +, #, or letter.
    c: {
      match: function(text) {
        if (!/\bC\b/.test(text)) return false;
        // False positives to reject
        if (/\b(?:plan|vitamin|section|exhibit|class|grade|annexure|appendix|c\/o)\s+C\b/i.test(text)) return false;
        if (/\bC\s+(?:section|grade|class|vitamin|plan)\b/i.test(text)) return false;
        // Valid programming matches
        return /\bC\s*\/\s*(?:C\+\+|Python|Java|Go|Rust|Assembly)\b/.test(text) ||
               /\b(?:Python|Java|C\+\+|Go|Rust|Assembly)\s*[,\/]\s*C\b/.test(text) ||
               /\bC\s+programming\b/i.test(text) ||
               /\bC\s+language\b/i.test(text) ||
               (/\bC\b/.test(text) && CONTEXT_WORDS.test(text) && !/\bC\+\+\b/.test(text) && /\b(?:in|with|using)\s+C\b/.test(text));
      }
    },
    // R: case-sensitive 'R', not "R&D", "R & D", "Toys 'R' Us"
    r: {
      match: function(text) {
        if (!/\bR\b/.test(text)) return false;
        if (/\bR\s*&\s*D\b/i.test(text)) return false;
        if (/\btoys\s+['"]?r['"]?\s+us\b/i.test(text)) return false;
        return /\bR\s+programming\b/i.test(text) ||
               /\bR\s+language\b/i.test(text) ||
               /\b(?:Python|SQL|Julia|SAS|SPSS|MATLAB)\s*[,\/]\s*R\b/.test(text) ||
               /\bR\s*[,\/]\s*(?:Python|SQL|Julia|SAS|SPSS|MATLAB)\b/.test(text) ||
               (/\bR\b/.test(text) && /\b(?:data|analytics|statistics|statistical|modeling)\b/i.test(text) && /\b(?:in|using)\s+R\b/.test(text));
      }
    },
    // Go: case-sensitive 'Go' or 'golang'. Prevent English verb "let's go", "go to market", "ongoing", "good"
    go: {
      match: function(text) {
        if (/\bgolang\b/i.test(text)) return true;
        if (!/\bGo\b/.test(text)) return false;
        if (/\blet'?s\s+go\b/i.test(text)) return false;
        if (/\bgo\s+to\s+market\b/i.test(text)) return false;
        if (/\bgo\s+live\b/i.test(text)) return false;
        if (/\bgo\s+deep\b/i.test(text)) return false;
        return /\bGo\s+programming\b/i.test(text) ||
               /\bGo\s+developer\b/i.test(text) ||
               /\bGo\s+engineer\b/i.test(text) ||
               /\bGo\s*[,\/]\s*(?:Python|Java|C\+\+|Rust|Node)\b/.test(text) ||
               /\b(?:Python|Java|C\+\+|Rust|Node)\s*[,\/]\s*Go\b/.test(text) ||
               (/\bGo\b/.test(text) && /\b(?:written in Go|services in Go|code in Go)\b/i.test(text));
      }
    },
    // Swift: case-sensitive 'Swift'. Prevent "swift response", "swift action", "taylor swift"
    swift: {
      match: function(text) {
        if (/\bswift\s+(?:ios|language|developer|engineer|programming|code|ui|app)\b/i.test(text)) return true;
        if (/\bswiftui\b/i.test(text)) return true;
        if (!/\bSwift\b/.test(text)) return false;
        if (/\bswift\s+(?:response|action|recovery|delivery|turnaround|speed|manner|progress)\b/i.test(text)) return false;
        return /\b(?:iOS|Objective-C|Xcode|Kotlin|Android)\s*[,\/]\s*Swift\b/.test(text) ||
               /\bSwift\s*[,\/]\s*(?:iOS|Objective-C|Xcode|Kotlin|Android)\b/.test(text) ||
               (/\bSwift\b/.test(text) && /\b(?:iOS|Apple|mobile development|Xcode)\b/i.test(text));
      }
    },
    // Rust: case-sensitive 'Rust' or 'rust-lang'. Prevent "rust-proof", "iron rust", "rust stains"
    rust: {
      match: function(text) {
        if (/\brust\s+(?:lang|language|developer|engineer|programming|code)\b/i.test(text)) return true;
        if (!/\bRust\b/.test(text)) return false;
        if (/\brust(?:-|s+)(?:proof|resistant|stain|prevent|corrosion|belt)\b/i.test(text)) return false;
        return /\b(?:Go|C\+\+|Python|Linux|WebAssembly|systems)\s*[,\/]\s*Rust\b/.test(text) ||
               /\bRust\s*[,\/]\s*(?:Go|C\+\+|Python|Linux|WebAssembly|systems)\b/.test(text) ||
               (/\bRust\b/.test(text) && CONTEXT_WORDS.test(text));
      }
    },
    // Ruby: case-sensitive 'Ruby' or 'ruby on rails'. Prevent "ruby gemstone", "ruby red"
    ruby: {
      match: function(text) {
        if (/\bruby\s+on\s+rails\b/i.test(text)) return true;
        if (/\bruby\s+(?:lang|language|developer|engineer|gem|programming)\b/i.test(text)) return true;
        if (!/\bRuby\b/.test(text)) return false;
        if (/\bruby\s+(?:gemstone|red|color|jewel|slippers)\b/i.test(text)) return false;
        return /\b(?:Python|Rails|JavaScript|PHP|PostgreSQL)\s*[,\/]\s*Ruby\b/.test(text) ||
               /\bRuby\s*[,\/]\s*(?:Python|Rails|JavaScript|PHP|PostgreSQL)\b/.test(text) ||
               (/\bRuby\b/.test(text) && CONTEXT_WORDS.test(text));
      }
    },
    // Spring: case-sensitive 'Spring'. Prevent "in the spring of 2024", "spring break", "spring semester"
    spring: {
      match: function(text) {
        if (/\bspring\s+(?:boot|framework|mvc|security|cloud|data)\b/i.test(text)) return true;
        if (!/\bSpring\b/.test(text)) return false;
        if (/\bspring\s+(?:of\s+\d{4}|\d{4}|break|semester|term|summer|season)\b/i.test(text)) return false;
        return /\b(?:Java|Hibernate|Microservices|REST)\s*[,\/]\s*Spring\b/.test(text) ||
               /\bSpring\s*[,\/]\s*(?:Java|Hibernate|Microservices|REST)\b/.test(text) ||
               (/\bSpring\b/.test(text) && /\b(?:Java|microservice|backend|bean|dependency injection)\b/i.test(text));
      }
    },
    // Flask: case-sensitive 'Flask'. Prevent "vacuum flask", "hip flask", "thermos flask"
    flask: {
      match: function(text) {
        if (/\bflask\s+(?:framework|microframework|app|api|backend|server)\b/i.test(text)) return true;
        if (!/\bFlask\b/.test(text)) return false;
        if (/\b(?:vacuum|hip|thermos|drinking|glass)\s+flask\b/i.test(text)) return false;
        return /\b(?:Python|Django|FastAPI|PostgreSQL)\s*[,\/]\s*Flask\b/.test(text) ||
               /\bFlask\s*[,\/]\s*(?:Python|Django|FastAPI|PostgreSQL)\b/.test(text) ||
               (/\bflask\b/i.test(text) && /\b(?:Python|REST|microservice|backend|API|web)\b/i.test(text));
      }
    },
    // Claude: case-sensitive 'Claude'. Prevent "Claude Monet", "Jean-Claude"
    claude: {
      match: function(text) {
        if (/\bclaude\s+(?:3|3\.5|sonnet|opus|haiku|api|model)\b/i.test(text)) return true;
        if (/\banthropic\s+claude\b/i.test(text)) return true;
        if (/\b(?:jean-?claude|claude\s+monet|claude\s+debussy)\b/i.test(text)) return false;
        return /\b(?:OpenAI|GPT|LLM|GenAI|Prompt|Anthropic)\s*[,\/]\s*Claude\b/i.test(text) ||
               /\bClaude\s*[,\/]\s*(?:OpenAI|GPT|LLM|GenAI|Prompt|Anthropic)\b/.test(text) ||
               (/\bClaude\b/.test(text) && /\b(?:LLM|AI|prompt|Anthropic|model|chatbot)\b/i.test(text));
      }
    },
    // SQL: exact \bsql\b (not (?<!no)sql\b per Amendment 1)
    sql: {
      match: function(text) {
        return /\bsql\b/i.test(text);
      }
    },
    // Java: \bjava\b(?!script)
    java: {
      match: function(text) {
        return /\bjava\b(?!script)/i.test(text);
      }
    }
  };

  function makeSkillRegex(str) {
    const escaped = str.replace(/[-/\^$*+?.()|[\]{}]/g, '\\$&');
    const leading = /^\w/.test(str) ? '\\b' : '(?:^|[\\s.,;\\/(])';
    const trailing = /\w$/.test(str) ? '\\b' : '(?![\\w+])';
    return new RegExp(leading + escaped + trailing, 'i');
  }

  // Compile regex patterns once at load time for fast matching (< 300ms budget)
  const COMPILED_SKILLS = SKILLS_DATA.map(item => {
    const patterns = [];
    if (!item.guarded) {
      patterns.push(makeSkillRegex(item.canonical));
    }

    (item.aliases || []).forEach(alias => {
      patterns.push(makeSkillRegex(alias));
    });

    return {
      canonical: item.canonical,
      category: item.category,
      aliases: item.aliases || [],
      implies: item.implies || [],
      guarded: item.guarded || null,
      patterns: patterns
    };
  });

  const SkillsAPI = {
    SKILLS: SKILLS_DATA,
    COMPILED_SKILLS: COMPILED_SKILLS,
    GUARDED_MATCHERS: GUARDED_MATCHERS
  };

  if (typeof window !== 'undefined') {
    window.PrepInterview = window.PrepInterview || {};
    window.PrepInterview.Skills = SkillsAPI;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillsAPI;
  }
})();
