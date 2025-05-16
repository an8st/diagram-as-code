import React from 'react';
import Demo from './Components/Demo.js'
import Header from './Components/Header.js'
import GlobContext from './Components/GlobContext.js';
import { Menu } from './Components/Menu.js';
import { v4 as uuid } from 'uuid';
import { Templates } from './Components/Constants.js';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'
import { diagramDB } from './services/db.js';
import { krokiService } from './services/kroki.js';
import { apiService } from './services/api.js';

const instance = createInstance({
  urlBase: 'https://ui.kroki.mts.ru',
  siteId: 841,
  trackerUrl: 'https://matomo.obs.mts.ru/matomo.php',
  srcUrl: 'https://matomo.obs.mts.ru/matomo.js',
});

function uniqueName(name, diagrams, number = 0) {
  var namesList = []; 
  Object.keys(diagrams).forEach(function(key) {
    namesList.push(diagrams[key].title);
  });

  if(namesList.includes(name + (number === 0 ? "" : " " + number))) {
    return uniqueName(name, diagrams, number + 1)
  } else {
    return name + (number === 0 ? "" : " " + number)
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    var uid = uuid();

    this.state = {
      menuState: false,
      activeDiag: uid,
      diagrams: {},
      gptTime: undefined,
      projects: [],
      selectedProject: null,
      loading: true,
      error: null
    }

    // Инициализация состояния с пустой диаграммой
    this.state.diagrams[this.state.activeDiag] = {
      title: uniqueName("Untitled Diagram", this.state.diagrams),
      code: Templates.plantuml,
      type: "plantuml",
      prevStack: [],
      stackIndex: 0,
      typingTimeout: 0,
    };

    this.changeActiveDiagram = this.changeActiveDiagram.bind(this);
    this.changeDiagramData = this.changeDiagramData.bind(this);
    this.changeMenuState = this.changeMenuState.bind(this);
    this.getActiveDiag = this.getActiveDiag.bind(this);
    this.removeDiagram = this.removeDiagram.bind(this);
    this.addNewDiagram = this.addNewDiagram.bind(this);
    this.addCopyDiagram = this.addCopyDiagram.bind(this);
    this.undoChanges = this.undoChanges.bind(this);
    this.redoChanges = this.redoChanges.bind(this);
    this.selectProject = this.selectProject.bind(this);
  }

  getActiveDiag() {
    return this.state.diagrams[this.state.activeDiag]
  }
  
  changeActiveDiagram(uid) {
    this.setState({activeDiag: uid})
  }

  async changeDiagramData(key, val) {
    if (!this.state.stackEdited) {
      const self = this;
      let d = self.state.diagrams;
      let _ad = self.state.activeDiag;
      d[_ad][key] = val;
      
      if (self.state.typingTimeout > 0) {
        clearTimeout(self.state.typingTimeout)
      }
  
      self.setState({
        typingTimeout: setTimeout(async function () {
          if (key !== "title") {
            // подготовка стека
            if (d[_ad].stackIndex < d[_ad].prevStack.length - 1) {
              d[_ad].prevStack = d[_ad].prevStack.slice(0, d[_ad].stackIndex);
            }
            if (d[_ad].prevStack.length > 20) {
              d[_ad].prevStack = d[_ad].prevStack.slice(-20);
            }
  
            d[_ad].prevStack.push({
              type: d[_ad].type,
              code: d[_ad].code,
            });
            d[_ad].stackIndex = d[_ad].prevStack.length - 1;
          }

          // Сохраняем в IndexedDB
          try {
            await diagramDB.saveDiagram(_ad, d[_ad]);

            // Если выбран проект, сохраняем также в GitLab
            if (self.state.selectedProject) {
              await apiService.updateDiagram(
                self.state.selectedProject.id,
                _ad,
                d[_ad]
              );
            }
          } catch (error) {
            console.error('Failed to save diagram:', error);
          }
        }, 400)
      });
    }
    this.state.stackEdited = undefined;
  }

  changeMenuState(v) {
    this.setState({menuState: v})
  }

  async removeDiagram(uid) {
    var diagrams = this.state.diagrams;
    if (Object.keys(this.state.diagrams).length === 1) {
      diagrams[uid] = {
        title: uniqueName("Untitled Diagram", this.state.diagrams),
        code: Templates.plantuml,
        type: "plantuml",
        prevStack: [],
        stackIndex: 0,
      };
      this.setState({activeDiag: Object.keys(diagrams)[0], diagrams: diagrams});
      await diagramDB.saveDiagram(uid, diagrams[uid]);
    } else {
      delete diagrams[uid];
      var activeDiag = (this.state.activeDiag === uid ? Object.keys(diagrams)[0] : this.state.activeDiag);
      this.setState({ activeDiag: activeDiag, diagrams: diagrams });
      await diagramDB.deleteDiagram(uid);

      // Если выбран проект, удаляем также из GitLab
      if (this.state.selectedProject) {
        try {
          await apiService.deleteDiagram(this.state.selectedProject.id, uid);
        } catch (error) {
          console.error('Failed to delete diagram from GitLab:', error);
        }
      }
    }
  }

  async addNewDiagram() {
    var diagrams = this.state.diagrams;
    var uid = uuid();
    const newDiagram = {
      title: uniqueName("Untitled Diagram (new)", this.state.diagrams),
      code: Templates.plantuml,
      type: "plantuml",
      prevStack: [],
      stackIndex: 0,
    };
    
    diagrams[uid] = newDiagram;
    this.changeActiveDiagram(uid);
    
    await diagramDB.saveDiagram(uid, newDiagram);

    // Если выбран проект, сохраняем также в GitLab
    if (this.state.selectedProject) {
      try {
        await apiService.createDiagram(this.state.selectedProject.id, {
          ...newDiagram,
          id: uid
        });
      } catch (error) {
        console.error('Failed to create diagram in GitLab:', error);
      }
    }
  }

  async addCopyDiagram(data) {
    var diagrams = this.state.diagrams;
    var uid = uuid();
    const newDiagram = {
      title: uniqueName(data.title + " (copy)", this.state.diagrams),
      code: data.code,
      type: data.type,
      prevStack: [],
      stackIndex: 0,
    };
    
    diagrams[uid] = newDiagram;
    this.changeActiveDiagram(uid);
    
    await diagramDB.saveDiagram(uid, newDiagram);

    // Если выбран проект, сохраняем также в GitLab
    if (this.state.selectedProject) {
      try {
        await apiService.createDiagram(this.state.selectedProject.id, {
          ...newDiagram,
          id: uid
        });
      } catch (error) {
        console.error('Failed to create diagram copy in GitLab:', error);
      }
    }
  }

  async undoChanges() {
    var diagrams = this.state.diagrams;
    if (diagrams[this.state.activeDiag].stackIndex > 0) {
      let stackDiag = diagrams[this.state.activeDiag].prevStack[diagrams[this.state.activeDiag].stackIndex - 1];
      diagrams[this.state.activeDiag].type = stackDiag.type;
      diagrams[this.state.activeDiag].code = stackDiag.code;
      diagrams[this.state.activeDiag].stackIndex = diagrams[this.state.activeDiag].stackIndex - 1;
      
      this.setState({stackEdited: true});
      await diagramDB.saveDiagram(this.state.activeDiag, diagrams[this.state.activeDiag]);

      // Если выбран проект, обновляем также в GitLab
      if (this.state.selectedProject) {
        try {
          await apiService.updateDiagram(
            this.state.selectedProject.id,
            this.state.activeDiag,
            diagrams[this.state.activeDiag]
          );
        } catch (error) {
          console.error('Failed to update diagram in GitLab:', error);
        }
      }
    }
  }

  async redoChanges() {
    var diagrams = this.state.diagrams;
    if (diagrams[this.state.activeDiag].stackIndex < diagrams[this.state.activeDiag].prevStack.length - 1) {
      let stackDiag = diagrams[this.state.activeDiag].prevStack[diagrams[this.state.activeDiag].stackIndex + 1];
      diagrams[this.state.activeDiag].type = stackDiag.type;
      diagrams[this.state.activeDiag].code = stackDiag.code;
      diagrams[this.state.activeDiag].stackIndex = diagrams[this.state.activeDiag].stackIndex + 1;
      
      this.setState({stackEdited: true});
      await diagramDB.saveDiagram(this.state.activeDiag, diagrams[this.state.activeDiag]);

      // Если выбран проект, обновляем также в GitLab
      if (this.state.selectedProject) {
        try {
          await apiService.updateDiagram(
            this.state.selectedProject.id,
            this.state.activeDiag,
            diagrams[this.state.activeDiag]
          );
        } catch (error) {
          console.error('Failed to update diagram in GitLab:', error);
        }
      }
    }
  }

  async selectProject(project) {
    this.setState({ selectedProject: project, loading: true });
    try {
      const result = await apiService.getDiagrams(project.id);
      const diagrams = {};
      result.diagrams.forEach(diagram => {
        diagrams[diagram.id] = diagram;
      });
      this.setState({
        diagrams,
        activeDiag: Object.keys(diagrams)[0] || uuid(),
        loading: false
      });
    } catch (error) {
      this.setState({
        error: 'Failed to load project diagrams',
        loading: false
      });
    }
  }

  async componentDidMount() {
    try {
      // Инициализируем IndexedDB
      await diagramDB.init();
      
      // Загружаем проекты из GitLab
      const projectsResult = await apiService.getProjects();
      this.setState({ projects: projectsResult.projects });

      // Загружаем диаграммы из IndexedDB
      const diagrams = await diagramDB.getAllDiagrams();
      if (Object.keys(diagrams).length > 0) {
        this.setState({
          diagrams,
          activeDiag: Object.keys(diagrams)[0]
        });
      } else {
        // Если диаграмм нет, сохраняем начальную диаграмму
        await diagramDB.saveDiagram(this.state.activeDiag, this.state.diagrams[this.state.activeDiag]);
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.setState({ error: 'Failed to initialize application' });
    } finally {
      this.setState({ loading: false });
    }

    document.addEventListener("keydown", (event) => {
      const code = event.which || event.keyCode;
      let charCode = String.fromCharCode(code).toLowerCase();

      if (!this.state.stackEdited) {
        if (charCode === "z" && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
          this.undoChanges();
          this.state.stackEdited = undefined;
          event.preventDefault();
        } else {
          if (charCode === "z" && (event.ctrlKey || event.metaKey) && event.shiftKey) {
            this.redoChanges();
            this.state.stackEdited = undefined;
            event.preventDefault();
          }
        }
      } else {
        this.state.stackEdited = undefined;
      }
    }, false);
  }

  render() {
    if (this.state.loading) {
      return <div>Loading...</div>;
    }

    if (this.state.error) {
      return <div>Error: {this.state.error}</div>;
    }

    return (
      <MatomoProvider value={instance}>
        <div className='mts'>
          <GlobContext.Provider value={{ 
            data: {
              ...this.state,
              krokiService, // Добавляем сервис для работы с Kroki
            },
            changeActiveDiagram: this.changeActiveDiagram,
            changeDiagramData: this.changeDiagramData,
            changeMenuState: this.changeMenuState,
            getActiveDiag: this.getActiveDiag,
            removeDiagram: this.removeDiagram,
            addNewDiagram: this.addNewDiagram,
            addCopyDiagram: this.addCopyDiagram,
            undoChanges: this.undoChanges,
            redoChanges: this.redoChanges,
            selectProject: this.selectProject,
          }}>
            <Header />
            <Demo />
            <Menu />
          </GlobContext.Provider>
        </div>  
      </MatomoProvider>
    );  
  }
}

export default App;
