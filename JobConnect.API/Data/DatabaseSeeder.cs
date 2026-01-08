using System.Text.Json;
using JobConnect.API.Models;
using JobConnect.API.Services;

namespace JobConnect.API.Data;

public static class DatabaseSeeder
{
    public static void SeedData(ApplicationDbContext db, IAuthService authService, bool force = false)
    {
        // Check if data already exists
        if (!force && (db.Companies.Any() || db.CandidateProfiles.Any()))
        {
            Console.WriteLine("Database already seeded. Skipping... (use FORCE_SEED=true to override)");
            return;
        }

        Console.WriteLine("Seeding database with sample data...");

        var now = DateTime.UtcNow;
        var random = new Random(42); // Fixed seed for reproducibility

        // =============================================
        // COMPANIES (10 companies)
        // =============================================
        var companyData = new[]
        {
            ("TechVision Labs", "Leading AI and machine learning solutions provider", "Technology", "Paris, France", 450, "https://techvision.example.com"),
            ("CloudScale Systems", "Enterprise cloud infrastructure and DevOps solutions", "Cloud Computing", "Lyon, France", 280, "https://cloudscale.example.com"),
            ("DataFlow Analytics", "Big data analytics and business intelligence", "Data Science", "Bordeaux, France", 150, "https://dataflow.example.com"),
            ("CyberShield Security", "Cybersecurity and threat protection services", "Security", "Toulouse, France", 200, "https://cybershield.example.com"),
            ("GreenTech Innovations", "Sustainable technology and eco-friendly solutions", "CleanTech", "Nantes, France", 120, "https://greentech.example.com"),
            ("FinanceCore Solutions", "Financial technology and banking software", "FinTech", "Paris, France", 350, "https://financecore.example.com"),
            ("HealthPlus Digital", "Healthcare technology and telemedicine platforms", "HealthTech", "Marseille, France", 180, "https://healthplus.example.com"),
            ("EduLearn Platform", "E-learning and educational technology", "EdTech", "Nice, France", 95, "https://edulearn.example.com"),
            ("LogiChain Systems", "Supply chain and logistics optimization", "Logistics", "Lille, France", 220, "https://logichain.example.com"),
            ("MediaStream Studios", "Digital media and streaming technology", "Media", "Paris, France", 300, "https://mediastream.example.com"),
        };

        var companies = new List<Company>();
        var companyUsers = new List<User>();

        for (int i = 0; i < companyData.Length; i++)
        {
            var (name, desc, industry, location, employees, website) = companyData[i];
            var emailDomain = name.ToLower().Replace(" ", "").Replace(".", "");
            
            var user = new User
            {
                Email = $"hr@{emailDomain}.com",
                PasswordHash = authService.HashPassword("Company123!"),
                Role = UserRole.Company,
                CreatedAt = now.AddDays(-random.Next(30, 365)),
                UpdatedAt = now
            };
            db.Users.Add(user);
            companyUsers.Add(user);
        }
        db.SaveChanges();

        for (int i = 0; i < companyData.Length; i++)
        {
            var (name, desc, industry, location, employees, website) = companyData[i];
            var company = new Company
            {
                UserId = companyUsers[i].Id,
                Name = name,
                Description = desc,
                Industry = industry,
                Location = location,
                EmployeeCount = employees,
                Website = website,
                CreatedAt = companyUsers[i].CreatedAt,
                UpdatedAt = now
            };
            db.Companies.Add(company);
            companies.Add(company);
        }
        db.SaveChanges();

        Console.WriteLine($"Created {companies.Count} companies");

        // =============================================
        // JOB POSTINGS (50+ jobs across companies)
        // =============================================
        var jobTemplates = new (string Title, string Description, string Requirements, string Benefits, JobType Type, int ExpMin, int ExpMax, decimal SalMin, decimal SalMax, int[] SkillIds)[]
        {
            // Backend Development
            ("Senior .NET Developer", 
             "We are looking for an experienced .NET developer to join our backend team. You will design, develop, and maintain high-performance applications using C# and .NET technologies.",
             "• 5+ years of C# development experience\n• Strong knowledge of .NET Core/6+\n• Experience with REST APIs and microservices\n• Database design and optimization skills",
             "• Competitive salary\n• Remote work options\n• Health insurance\n• Learning budget",
             JobType.FullTime, 5, 8, 55000, 75000, new[] { 1, 2, 9, 12 }),

            ("Junior Backend Developer",
             "Great opportunity for a junior developer to grow with our team. You'll work on exciting projects and learn from senior developers.",
             "• 1-2 years of programming experience\n• Knowledge of C# or Java\n• Understanding of databases\n• Eager to learn",
             "• Mentorship program\n• Training opportunities\n• Flexible hours",
             JobType.FullTime, 1, 2, 35000, 42000, new[] { 1, 8, 9 }),

            ("Python Backend Engineer",
             "Join our data-driven team to build scalable backend systems using Python and modern frameworks.",
             "• 3+ years Python experience\n• Django or FastAPI knowledge\n• Database experience\n• API design skills",
             "• Stock options\n• Remote first\n• Unlimited PTO",
             JobType.Remote, 3, 5, 50000, 65000, new[] { 7, 9, 12 }),

            // Frontend Development
            ("Angular Frontend Developer",
             "We're seeking a skilled Angular developer to create beautiful, responsive user interfaces for our enterprise applications.",
             "• 3+ years Angular experience\n• Strong TypeScript skills\n• RxJS expertise\n• UI/UX sensibility",
             "• Modern tech stack\n• Team events\n• Home office setup budget",
             JobType.FullTime, 3, 5, 48000, 60000, new[] { 3, 4, 14 }),

            ("React Developer",
             "Build next-generation user experiences with React and modern JavaScript technologies.",
             "• 2+ years React experience\n• JavaScript/TypeScript proficiency\n• State management (Redux/MobX)\n• Testing experience",
             "• Flexible schedule\n• Conference attendance\n• Health benefits",
             JobType.FullTime, 2, 4, 45000, 58000, new[] { 5, 6, 4, 14 }),

            ("Senior Frontend Engineer",
             "Lead our frontend initiatives and mentor junior developers while building cutting-edge web applications.",
             "• 6+ years frontend experience\n• Expert in React or Angular\n• Performance optimization\n• Team leadership",
             "• Leadership role\n• Equity package\n• Premium insurance",
             JobType.FullTime, 6, 10, 70000, 90000, new[] { 3, 4, 5, 6, 14 }),

            // Full Stack
            ("Full Stack Developer",
             "Work across the entire stack to deliver complete features from database to user interface.",
             "• 3+ years full-stack experience\n• Backend: .NET, Python, or Node.js\n• Frontend: React or Angular\n• Database knowledge",
             "• Diverse projects\n• Skill development\n• Team lunches",
             JobType.FullTime, 3, 6, 52000, 68000, new[] { 1, 2, 3, 4, 9 }),

            ("Full Stack JavaScript Developer",
             "Join our team to build modern web applications using JavaScript across the stack.",
             "• Node.js backend experience\n• React/Vue frontend skills\n• MongoDB or PostgreSQL\n• REST/GraphQL APIs",
             "• Startup environment\n• Growth opportunities\n• Remote options",
             JobType.FullTime, 2, 5, 48000, 62000, new[] { 5, 6, 9, 12, 13 }),

            // DevOps
            ("DevOps Engineer",
             "Streamline our development and deployment processes with modern DevOps practices.",
             "• 3+ years DevOps experience\n• Docker and Kubernetes\n• CI/CD pipelines\n• Cloud platforms (AWS/GCP/Azure)",
             "• Cutting-edge tools\n• On-call compensation\n• Training budget",
             JobType.FullTime, 3, 6, 55000, 72000, new[] { 10, 11 }),

            ("Senior DevOps/SRE Engineer",
             "Lead our infrastructure initiatives and ensure high availability and scalability of our systems.",
             "• 5+ years DevOps/SRE experience\n• Infrastructure as Code\n• Monitoring and alerting\n• Incident management",
             "• Technical leadership\n• Excellent compensation\n• Work-life balance",
             JobType.Remote, 5, 8, 70000, 90000, new[] { 10, 11 }),

            // Data
            ("Data Engineer",
             "Build and maintain data pipelines to power our analytics and machine learning initiatives.",
             "• 3+ years data engineering\n• Python and SQL expertise\n• ETL/ELT experience\n• Cloud data platforms",
             "• Impactful work\n• Modern data stack\n• Learning opportunities",
             JobType.FullTime, 3, 5, 52000, 68000, new[] { 7, 9 }),

            ("Data Scientist",
             "Apply machine learning and statistical methods to solve complex business problems.",
             "• 2+ years data science experience\n• Python, R, or Julia\n• ML frameworks (TensorFlow, PyTorch)\n• Statistical modeling",
             "• Research opportunities\n• Conference attendance\n• Publication support",
             JobType.FullTime, 2, 5, 55000, 75000, new[] { 7 }),

            // Internships
            ("Software Engineering Intern",
             "6-month internship opportunity to learn software development in a professional environment.",
             "• Currently enrolled in CS or related field\n• Basic programming knowledge\n• Eagerness to learn\n• Team player",
             "• Paid internship\n• Mentorship\n• Potential full-time offer",
             JobType.Internship, 0, 1, 15000, 18000, new[] { 5, 11 }),

            ("Data Science Intern",
             "Join our data team to work on real-world machine learning projects.",
             "• Studying data science or related field\n• Python basics\n• Statistics knowledge\n• Curious mindset",
             "• Real project work\n• Learning environment\n• Career growth",
             JobType.Internship, 0, 1, 14000, 17000, new[] { 7, 9 }),

            // Contract/Part-time
            ("Freelance Frontend Developer",
             "Looking for a skilled frontend developer for a 6-month project to redesign our web platform.",
             "• 4+ years frontend experience\n• Modern JavaScript frameworks\n• Responsive design\n• Available immediately",
             "• Competitive daily rate\n• Remote work\n• Flexible schedule",
             JobType.Contract, 4, 7, 400, 550, new[] { 5, 6, 14 }),

            ("Part-time Backend Developer",
             "Join our team part-time to help maintain and improve our backend systems.",
             "• 2+ years backend experience\n• JavaScript or Python\n• Database skills\n• 20 hours/week availability",
             "• Flexible hours\n• Remote work\n• Interesting projects",
             JobType.PartTime, 2, 4, 25000, 32000, new[] { 7, 9, 12 }),

            // Specialized roles
            ("API Developer",
             "Design and implement RESTful and GraphQL APIs for our microservices architecture.",
             "• 3+ years API development\n• REST and GraphQL expertise\n• API security\n• Documentation skills",
             "• Technical challenges\n• Great team\n• Growth potential",
             JobType.FullTime, 3, 5, 50000, 65000, new[] { 12, 13 }),

            ("Mobile Developer (Cross-platform)",
             "Build mobile applications using cross-platform technologies for iOS and Android.",
             "• 2+ years mobile development\n• React Native or Flutter\n• Native platform knowledge\n• App Store experience",
             "• Mobile-first team\n• Device budget\n• App credits",
             JobType.FullTime, 2, 4, 48000, 62000, new[] { 5, 4 }),

            ("Security Engineer",
             "Protect our systems and data by implementing security best practices and conducting assessments.",
             "• 4+ years security experience\n• Penetration testing\n• Security tools\n• Compliance knowledge",
             "• Critical role\n• Training certifications\n• Competitive pay",
             JobType.FullTime, 4, 7, 60000, 80000, new[] { 10, 11 }),

            ("Technical Lead",
             "Lead a team of developers and drive technical decisions for our core platform.",
             "• 7+ years development experience\n• 2+ years leadership\n• Architecture skills\n• Excellent communication",
             "• Leadership position\n• Strategic influence\n• Top compensation",
             JobType.FullTime, 7, 12, 80000, 100000, new[] { 1, 2, 10, 15 }),
        };

        var jobPostings = new List<JobPosting>();
        var statuses = new[] { JobStatus.Published, JobStatus.Published, JobStatus.Published, JobStatus.Draft, JobStatus.Closed };
        var locations = new[] { "Paris, France", "Lyon, France", "Remote", "Bordeaux, France", "Toulouse, France", "Hybrid - Paris" };

        foreach (var company in companies)
        {
            // Each company gets 4-7 jobs
            int jobCount = random.Next(4, 8);
            var usedTemplates = new HashSet<int>();

            for (int j = 0; j < jobCount; j++)
            {
                int templateIndex;
                do { templateIndex = random.Next(jobTemplates.Length); } 
                while (usedTemplates.Contains(templateIndex) && usedTemplates.Count < jobTemplates.Length);
                usedTemplates.Add(templateIndex);

                var template = jobTemplates[templateIndex];
                var status = statuses[random.Next(statuses.Length)];
                var createdAt = now.AddDays(-random.Next(1, 90));

                var job = new JobPosting
                {
                    CompanyId = company.Id,
                    Title = template.Title,
                    Description = template.Description,
                    Requirements = template.Requirements,
                    Benefits = template.Benefits,
                    Location = locations[random.Next(locations.Length)],
                    Type = template.Type,
                    SalaryMin = template.SalMin,
                    SalaryMax = template.SalMax,
                    SalaryCurrency = "EUR",
                    Status = status,
                    ExperienceYearsMin = template.ExpMin,
                    ExperienceYearsMax = template.ExpMax,
                    CreatedAt = createdAt,
                    UpdatedAt = now,
                    PublishedAt = status == JobStatus.Published ? createdAt.AddHours(random.Next(1, 48)) : null,
                    ClosedAt = status == JobStatus.Closed ? now.AddDays(-random.Next(1, 10)) : null
                };
                db.JobPostings.Add(job);
                jobPostings.Add(job);
            }
        }
        db.SaveChanges();

        // Add skills to jobs
        foreach (var job in jobPostings)
        {
            var template = jobTemplates.FirstOrDefault(t => t.Title == job.Title);
            if (template.SkillIds != null)
            {
                foreach (var skillId in template.SkillIds)
                {
                    if (!db.JobSkills.Any(js => js.JobPostingId == job.Id && js.SkillId == skillId))
                    {
                        db.JobSkills.Add(new JobSkill { JobPostingId = job.Id, SkillId = skillId });
                    }
                }
            }
        }
        db.SaveChanges();

        Console.WriteLine($"Created {jobPostings.Count} job postings");

        // =============================================
        // CANDIDATES (30+ candidates)
        // =============================================
        var candidateData = new (string FirstName, string LastName, string Summary, string Location, int[] SkillIds, string Phone)[]
        {
            ("Marie", "Dupont", "Full-stack developer with 5 years of experience in .NET and Angular. Passionate about clean code and agile methodologies.", "Paris, France", new[] { 1, 2, 3, 4, 9, 11, 15 }, "+33 6 12 34 56 01"),
            ("Jean", "Martin", "Senior backend developer specialized in microservices architecture and cloud solutions.", "Lyon, France", new[] { 1, 2, 7, 9, 10, 12 }, "+33 6 12 34 56 02"),
            ("Sophie", "Bernard", "Frontend specialist with expertise in React and modern JavaScript. UX enthusiast.", "Bordeaux, France", new[] { 5, 6, 4, 14, 11 }, "+33 6 12 34 56 03"),
            ("Thomas", "Petit", "DevOps engineer passionate about automation and infrastructure as code.", "Toulouse, France", new[] { 10, 11, 7, 9 }, "+33 6 12 34 56 04"),
            ("Camille", "Robert", "Data scientist with strong background in machine learning and statistical analysis.", "Paris, France", new[] { 7, 9 }, "+33 6 12 34 56 05"),
            ("Lucas", "Richard", "Junior developer eager to learn and grow. Recent CS graduate with internship experience.", "Nantes, France", new[] { 5, 7, 11 }, "+33 6 12 34 56 06"),
            ("Emma", "Durand", "Angular developer with 3 years of experience building enterprise applications.", "Paris, France", new[] { 3, 4, 14, 12 }, "+33 6 12 34 56 07"),
            ("Hugo", "Leroy", "Python enthusiast with experience in Django and data engineering.", "Marseille, France", new[] { 7, 9, 10 }, "+33 6 12 34 56 08"),
            ("Léa", "Moreau", "Full-stack JavaScript developer with Node.js and React expertise.", "Nice, France", new[] { 5, 6, 4, 12, 13 }, "+33 6 12 34 56 09"),
            ("Nathan", "Simon", "Security-focused developer with experience in secure coding practices.", "Lille, France", new[] { 1, 2, 10, 11 }, "+33 6 12 34 56 10"),
            ("Chloé", "Laurent", "Mobile developer with React Native and iOS experience.", "Paris, France", new[] { 5, 6, 4 }, "+33 6 12 34 56 11"),
            ("Maxime", "Garcia", "Backend developer with Java and Spring Boot expertise.", "Lyon, France", new[] { 8, 9, 10, 12 }, "+33 6 12 34 56 12"),
            ("Manon", "Martinez", "Data engineer building scalable data pipelines.", "Bordeaux, France", new[] { 7, 9 }, "+33 6 12 34 56 13"),
            ("Alexandre", "Roux", "Technical lead with 8 years of experience in enterprise software.", "Paris, France", new[] { 1, 2, 8, 10, 15 }, "+33 6 12 34 56 14"),
            ("Julie", "Vincent", "Frontend developer with design skills and accessibility expertise.", "Toulouse, France", new[] { 5, 6, 14, 4 }, "+33 6 12 34 56 15"),
            ("Antoine", "Muller", "Cloud architect with AWS and Azure certifications.", "Paris, France", new[] { 10, 11, 9 }, "+33 6 12 34 56 16"),
            ("Sarah", "Fournier", "QA engineer transitioning to development with strong testing background.", "Nantes, France", new[] { 7, 11 }, "+33 6 12 34 56 17"),
            ("Romain", "Girard", ".NET developer with experience in financial services.", "Paris, France", new[] { 1, 2, 9, 12 }, "+33 6 12 34 56 18"),
            ("Laura", "Andre", "Agile coach and developer passionate about team productivity.", "Lyon, France", new[] { 1, 3, 11, 15 }, "+33 6 12 34 56 19"),
            ("Quentin", "Lefevre", "GraphQL specialist with full-stack capabilities.", "Marseille, France", new[] { 5, 6, 12, 13 }, "+33 6 12 34 56 20"),
            ("Pauline", "Michel", "Recent bootcamp graduate with strong fundamentals in web development.", "Paris, France", new[] { 5, 14, 11 }, "+33 6 12 34 56 21"),
            ("Théo", "Blanc", "Backend developer focused on API design and microservices.", "Bordeaux, France", new[] { 1, 2, 12, 10 }, "+33 6 12 34 56 22"),
            ("Clara", "Guerin", "Angular and TypeScript expert with enterprise experience.", "Toulouse, France", new[] { 3, 4, 14, 15 }, "+33 6 12 34 56 23"),
            ("Valentin", "Boyer", "Python developer with machine learning interests.", "Nice, France", new[] { 7, 9 }, "+33 6 12 34 56 24"),
            ("Anaïs", "Lopez", "Full-stack developer with startup experience.", "Paris, France", new[] { 5, 6, 7, 9, 11 }, "+33 6 12 34 56 25"),
            ("Mathieu", "Clement", "Senior React developer with performance optimization skills.", "Lyon, France", new[] { 5, 6, 4, 14 }, "+33 6 12 34 56 26"),
            ("Marine", "Morel", "DevOps enthusiast with Kubernetes expertise.", "Lille, France", new[] { 10, 11, 7 }, "+33 6 12 34 56 27"),
            ("Bastien", "Rousseau", "Java developer with Spring and microservices experience.", "Marseille, France", new[] { 8, 9, 10, 12 }, "+33 6 12 34 56 28"),
            ("Océane", "Henry", "Data analyst transitioning to data science.", "Nantes, France", new[] { 7, 9 }, "+33 6 12 34 56 29"),
            ("Florian", "Gauthier", "Frontend developer with Vue.js and React experience.", "Paris, France", new[] { 5, 6, 4, 14, 11 }, "+33 6 12 34 56 30"),
            ("Margot", "Perrin", "Software engineer with .NET and Azure expertise.", "Lyon, France", new[] { 1, 2, 10, 9 }, "+33 6 12 34 56 31"),
            ("Dylan", "Robin", "Junior Python developer with data engineering interests.", "Bordeaux, France", new[] { 7, 9, 11 }, "+33 6 12 34 56 32"),
        };

        var experienceTemplates = new[]
        {
            new Experience { Company = "Previous Tech Co", Title = "Software Developer", StartDate = now.AddYears(-3), EndDate = now.AddYears(-1), Description = "Developed web applications using modern technologies" },
            new Experience { Company = "Startup XYZ", Title = "Junior Developer", StartDate = now.AddYears(-5), EndDate = now.AddYears(-3), Description = "Built MVP and contributed to product development" },
            new Experience { Company = "Big Corp Inc", Title = "Senior Developer", StartDate = now.AddYears(-2), IsCurrentRole = true, Description = "Leading development of core platform features" },
            new Experience { Company = "Agency Plus", Title = "Full Stack Developer", StartDate = now.AddYears(-4), EndDate = now.AddYears(-2), Description = "Delivered multiple client projects" },
            new Experience { Company = "Consulting Group", Title = "Technical Consultant", StartDate = now.AddYears(-1), IsCurrentRole = true, Description = "Providing technical guidance to clients" },
        };

        var educationTemplates = new[]
        {
            new Education { Institution = "Université Paris-Saclay", Degree = "Master's", Field = "Computer Science", GraduationYear = 2020 },
            new Education { Institution = "EPITECH", Degree = "Expert", Field = "Information Technology", GraduationYear = 2019 },
            new Education { Institution = "École 42", Degree = "Diploma", Field = "Software Engineering", GraduationYear = 2021 },
            new Education { Institution = "INSA Lyon", Degree = "Engineering Degree", Field = "Computer Science", GraduationYear = 2018 },
            new Education { Institution = "Université de Bordeaux", Degree = "Bachelor's", Field = "Computer Science", GraduationYear = 2022 },
        };

        var certificationTemplates = new[]
        {
            new Certification { Name = "AWS Certified Solutions Architect", Issuer = "Amazon Web Services", IssueDate = now.AddYears(-1) },
            new Certification { Name = "Azure Developer Associate", Issuer = "Microsoft", IssueDate = now.AddMonths(-6) },
            new Certification { Name = "Professional Scrum Master I", Issuer = "Scrum.org", IssueDate = now.AddYears(-2) },
            new Certification { Name = "Google Cloud Professional", Issuer = "Google", IssueDate = now.AddMonths(-8) },
        };

        var candidateProfiles = new List<CandidateProfile>();
        var candidateUsers = new List<User>();

        // Create candidate users first
        foreach (var (firstName, lastName, summary, location, skillIds, phone) in candidateData)
        {
            var email = $"{firstName.ToLower()}.{lastName.ToLower()}@email.com"
                .Replace("é", "e").Replace("ï", "i").Replace("ë", "e").Replace("ô", "o").Replace("ç", "c");

            var user = new User
            {
                Email = email,
                PasswordHash = authService.HashPassword("Candidate123!"),
                Role = UserRole.Candidate,
                FirstName = firstName,
                LastName = lastName,
                CreatedAt = now.AddDays(-random.Next(30, 300)),
                UpdatedAt = now
            };
            db.Users.Add(user);
            candidateUsers.Add(user);
        }
        db.SaveChanges();

        // Create candidate profiles
        for (int i = 0; i < candidateData.Length; i++)
        {
            var (firstName, lastName, summary, location, skillIds, phone) = candidateData[i];
            var user = candidateUsers[i];

            // Generate experience (1-3 entries)
            var expCount = random.Next(1, 4);
            var experiences = new List<Experience>();
            for (int e = 0; e < expCount; e++)
            {
                var template = experienceTemplates[random.Next(experienceTemplates.Length)];
                experiences.Add(new Experience
                {
                    Company = template.Company + (random.Next(2) == 0 ? "" : " " + (random.Next(1, 99))),
                    Title = template.Title,
                    StartDate = now.AddYears(-random.Next(1, 6)),
                    EndDate = e == 0 && random.Next(2) == 0 ? null : now.AddYears(-random.Next(0, 2)),
                    IsCurrentRole = e == 0 && random.Next(2) == 0,
                    Description = template.Description
                });
            }

            // Generate education (1-2 entries)
            var eduCount = random.Next(1, 3);
            var educations = new List<Education>();
            for (int e = 0; e < eduCount; e++)
            {
                var template = educationTemplates[random.Next(educationTemplates.Length)];
                educations.Add(new Education
                {
                    Institution = template.Institution,
                    Degree = template.Degree,
                    Field = template.Field,
                    GraduationYear = random.Next(2015, 2024)
                });
            }

            // Generate certifications (0-2 entries)
            var certCount = random.Next(0, 3);
            var certifications = new List<Certification>();
            for (int c = 0; c < certCount; c++)
            {
                var template = certificationTemplates[random.Next(certificationTemplates.Length)];
                certifications.Add(new Certification
                {
                    Name = template.Name,
                    Issuer = template.Issuer,
                    IssueDate = now.AddMonths(-random.Next(1, 24))
                });
            }

            var profile = new CandidateProfile
            {
                UserId = user.Id,
                FirstName = firstName,
                LastName = lastName,
                Phone = phone,
                Summary = summary,
                Location = location,
                ExperienceJson = JsonSerializer.Serialize(experiences),
                EducationJson = JsonSerializer.Serialize(educations),
                CertificationsJson = certifications.Count > 0 ? JsonSerializer.Serialize(certifications) : null,
                CreatedAt = user.CreatedAt,
                UpdatedAt = now
            };
            db.CandidateProfiles.Add(profile);
            candidateProfiles.Add(profile);
        }
        db.SaveChanges();

        // Add skills to candidates
        for (int i = 0; i < candidateData.Length; i++)
        {
            var profile = candidateProfiles[i];
            var skillIds = candidateData[i].SkillIds;
            foreach (var skillId in skillIds)
            {
                db.CandidateSkills.Add(new CandidateSkill
                {
                    CandidateProfileId = profile.Id,
                    SkillId = skillId
                });
            }
        }
        db.SaveChanges();

        Console.WriteLine($"Created {candidateProfiles.Count} candidate profiles");

        // =============================================
        // APPLICATIONS (Many applications across jobs)
        // =============================================
        var applicationStatuses = new[] { ApplicationStatus.Submitted, ApplicationStatus.Screening, ApplicationStatus.Interview, ApplicationStatus.Offer, ApplicationStatus.Hired, ApplicationStatus.Rejected };
        var coverLetterTemplates = new[]
        {
            "I am very interested in this position and believe my skills align perfectly with your requirements. I would love the opportunity to contribute to your team.",
            "With my background in software development and passion for technology, I am confident I can make valuable contributions to your organization.",
            "I am excited about this opportunity and eager to bring my experience and enthusiasm to your team. I look forward to discussing how I can help achieve your goals.",
            null, // No cover letter
            null,
        };

        var publishedJobs = jobPostings.Where(j => j.Status == JobStatus.Published).ToList();
        int appCount = 0;

        foreach (var candidate in candidateProfiles)
        {
            // Each candidate applies to 2-6 jobs
            int applyCount = random.Next(2, 7);
            var appliedJobs = new HashSet<int>();

            for (int a = 0; a < applyCount && appliedJobs.Count < publishedJobs.Count; a++)
            {
                int jobIndex;
                do { jobIndex = random.Next(publishedJobs.Count); }
                while (appliedJobs.Contains(jobIndex));
                appliedJobs.Add(jobIndex);

                var job = publishedJobs[jobIndex];
                var status = applicationStatuses[random.Next(applicationStatuses.Length)];
                var appliedAt = job.PublishedAt!.Value.AddDays(random.Next(1, 30));

                var application = new Application
                {
                    CandidateProfileId = candidate.Id,
                    JobPostingId = job.Id,
                    Status = status,
                    MatchingScore = random.Next(40, 100),
                    CoverLetter = coverLetterTemplates[random.Next(coverLetterTemplates.Length)],
                    Notes = status == ApplicationStatus.Interview ? "Scheduled for technical interview" : 
                            status == ApplicationStatus.Offer ? "Excellent candidate, making offer" : null,
                    KanbanOrder = appCount,
                    AppliedAt = appliedAt,
                    UpdatedAt = appliedAt.AddDays(random.Next(0, 14))
                };
                db.Applications.Add(application);
                appCount++;
            }
        }
        db.SaveChanges();

        Console.WriteLine($"Created {appCount} applications");
        Console.WriteLine("Database seeding completed successfully!");
    }
}
