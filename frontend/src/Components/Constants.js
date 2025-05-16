export const Templates = {
    c4plantuml: `!include <C4/C4_Deployment>

AddElementTag("fallback", $bgColor="#c0c0c0")
AddRelTag("fallback", $textColor="#c0c0c0", $lineColor="#438DD5")

' calculated legend is used (activated in last line)
' LAYOUT_WITH_LEGEND()

title Deployment Diagram for Internet Banking System - Live

Deployment_Node(plc, "Big Bank plc", "Big Bank plc data center"){
    Deployment_Node(dn, "bigbank-api***\tx8", "Ubuntu 16.04 LTS"){
        Deployment_Node(apache, "Apache Tomcat", "Apache Tomcat 8.x"){
            Container(api, "API Application", "Java and Spring MVC", "Provides Internet Banking functionality via a JSON/HTTPS API.")
        }
    }
    Deployment_Node(bigbankdb01, "bigbank-db01", "Ubuntu 16.04 LTS"){
        Deployment_Node(oracle, "Oracle - Primary", "Oracle 12c"){
            ContainerDb(db, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.")
        }
    }
    Deployment_Node(bigbankdb02, "bigbank-db02", "Ubuntu 16.04 LTS", $tags="fallback") {
        Deployment_Node(oracle2, "Oracle - Secondary", "Oracle 12c", $tags="fallback") {
            ContainerDb(db2, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.", $tags="fallback")
        }
    }
    Deployment_Node(bb2, "bigbank-web***\tx4", "Ubuntu 16.04 LTS"){
        Deployment_Node(apache2, "Apache Tomcat", "Apache Tomcat 8.x"){
            Container(web, "Web Application", "Java and Spring MVC", "Delivers the static content and the Internet Banking single page application.")
        }
    }
}

Deployment_Node(mob, "Customer's mobile device", "Apple IOS or Android"){
    Container(mobile, "Mobile App", "Xamarin", "Provides a limited subset of the Internet Banking functionality to customers via their mobile device.")
}

Deployment_Node(comp, "Customer's computer", "Microsoft Windows or Apple macOS"){
    Deployment_Node(browser, "Web Browser", "Google Chrome, Mozilla Firefox, Apple Safari or Microsoft Edge"){
        Container(spa, "Single Page Application", "JavaScript and Angular", "Provides all of the Internet Banking functionality to customers via their web browser.")
    }
}

Rel(mobile, api, "Makes API calls to", "json/HTTPS")
Rel(spa, api, "Makes API calls to", "json/HTTPS")
Rel_U(web, spa, "Delivers to the customer's web browser")
Rel(api, db, "Reads from and writes to", "JDBC")
Rel(api, db2, "Reads from and writes to", "JDBC", $tags="fallback")
Rel_R(db, db2, "Replicates data to")

SHOW_LEGEND()`,
  plantuml: `@startuml
  
  skinparam component {
      FontColor          black
      AttributeFontColor black
      FontSize           17
      AttributeFontSize  15
      AttributeFontname  Droid Sans Mono
      BackgroundColor    #6A9EFF
      BorderColor        black
      ArrowColor         #222266
  }
  
  title "OSCIED Charms Relations (Simple)"
  skinparam componentStyle uml2
  
  cloud {
      interface "JuJu" as juju
      interface "API" as api
      interface "Storage" as storage
      interface "Transform" as transform
      interface "Publisher" as publisher
      interface "Website" as website
  
      juju - [JuJu]
  
      website - [WebUI]
      [WebUI] .up.> juju
      [WebUI] .down.> storage
      [WebUI] .right.> api
  
      api - [Orchestra]
      transform - [Orchestra]
      publisher - [Orchestra]
      [Orchestra] .up.> juju
      [Orchestra] .down.> storage
  
      [Transform] .up.> juju
      [Transform] .down.> storage
      [Transform] ..> transform
  
      [Publisher] .up.> juju
      [Publisher] .down.> storage
      [Publisher] ..> publisher
  
      storage - [Storage]
      [Storage] .up.> juju
  }
  
  @enduml`,
   mermaid: `graph TD
   A[ Anyone ] -->|Can help | B( Go to github.com/yuzutech/kroki )
   B --> C{ How to contribute? }
   C --> D[ Reporting bugs ]
   C --> E[ Sharing ideas ]
   C --> F[ Advocating ]`,
   graphviz: `digraph D {
    subgraph cluster_p {
      label = "Kroki";
      subgraph cluster_c1 {
        label = "Server";
        Filebeat;
        subgraph cluster_gc_1 {
          label = "Docker/Server";
          Java;
        }
        subgraph cluster_gc_2 {
          label = "Docker/Mermaid";
          "Node.js";
          "Puppeteer";
          "Chrome";
        }
      }
      subgraph cluster_c2 {
        label = "CLI";
        Golang;
      }
    }
  }`
  };
  
  export const LanguageMapping = {
    plantuml: "plant-uml",
    c4plantuml: "plant-uml",
    mermaid: "mermaid",
    graphviz: "dot"
  }

  export const LanguageNaming = {
    plantuml: "PlantUML",
    c4plantuml: "PlantUML + C4",
    mermaid: "Mermaid",
    graphviz: "GraphViz"
  }

  export const GPTPromt = (type, code, task) => {
    return `If you have an answer, please generate that answer using the following rules:

    Rule 1. Do not generate any response behind pattern brackets (<# and #>).
    Rule 2. Don't use pattern brackets.
    Rule 3. Do not change names or titles unless required by the task.
    Rule 4. Answer with a ${type} notation only! Don't use any text out of code block!
    Rule 5. Use this ${type} notation diagram between pattern brackets (<# and #>) as a context:
    
    <#${code}#>
    
    Your task:${task}`
  }

  export const LanguageComments = {
    plantuml: "'",
    c4plantuml: "'",
    mermaid: "%%",
    graphviz: "//"
  }