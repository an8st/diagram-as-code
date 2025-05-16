import React from 'react';
import { ButtonGroup, Button, Badge, Typography, Tooltip, Box, Input, IconButton } from '@mui/material';
import GlobContext from './GlobContext';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import { v4 as uuid } from 'uuid';
import { useMatomo } from '@datapunt/matomo-tracker-react';

function getLink(t, c) {
    var enc = window.getEncodeData(c)
    return `https://kroki.mts-corp.ru/${t}/svg/${enc}`
  }

function MatomoTracker(Component) {
    return function WrappedComponent(props) {
        const { trackEvent } = useMatomo();
        return <Component {...props} trackEvent={trackEvent} />;
    } 
}

const fileType = {
    plantuml: "puml",
    c4plantuml: "puml",
    mermaid: "mmd",
    erd: "erd",
    graphviz: "gv",
}

const typeFile = {
    puml: "plantuml",
    uml: "plantuml",
    pu: "plantuml",
    wsd: "plantuml",
    plantuml: "plantuml",
    erd: "erd",
    mmd: "mermaid",
    mermaid: "mermaid",
    dot: "graphviz",
    gv: "graphviz"
}

function makeFile(diagData, event) {
    if (event.target) {
        var filedata = diagData.code
        const blob = new Blob([filedata], { type: "text/vnd" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.download = `${diagData.title}.${fileType[diagData.type]}`
        link.href = url;
        
        link.click();
    }
}

function makeImage(type, code, title) {
    const url = getLink(type, code).replace("/svg/", "/png/");
    const link = document.createElement("a");
    link.download = `${title}.png`
    link.href = url;
    link.target = "_blank";
    
    link.click();
}


class Header extends React.Component {
    
    static contextType = GlobContext;
    
    constructor(props) {
        super(props);
        this.state = {
            title: "Untitled Diagram",
            copyT: "Клонировать диаграмму",
            copyL: "Получить API ссылку",
        }

        this.loadFile = this.loadFile.bind(this);
    }


    loadFile() {

        const getText = (file) => {
            return new Promise((resolve,reject) => {
               const reader = new FileReader();
               reader.onload = () => resolve(reader.result);
               reader.onerror = error => reject(error);
               reader.readAsText(file);
            });
          }
    
        const imageUpload = (e) => {
            const file = e.target.files[0];
            getText(file).then(text => {
              const id = uuid();
              this.context.data.diagrams[id] = {
                title: file.name.split(".")[0],
                type: typeFile[file.name.split(".").slice(-1)],
                code: text
              };
              this.context.changeActiveDiagram(id);
              this.setState({loaded: true})
            });
        };
    
        const inp = document.createElement("input");
        inp.type = "file";
        inp.id = "pumlFile";
        inp.name = "pumlFile";
        inp.accept = ".wsd,.puml,.uml,.plantuml,.erd,.mmd,.mermaid,.dot,.gv"
        inp.onchange = imageUpload
        
        inp.click();
    }

    render () {
        const trackEvent = this.props.trackEvent;
        return (
            <Box
                className="header"
                >
                <Box sx={{width: "50%", display: "inline-flex"}}>
                    <img src="logo-eco.svg" width={"32px"}/>
                    <Typography  pl={1} className='mts' component="h1" variant="h5" sx={{ alignSelf: "center" }}>
                        <b>DaC.</b>
                    </Typography>

                    <Input
                        value={this.context.getActiveDiag().title}
                        onChange={(e) => {this.context.changeDiagramData("title", e.target.value)}}
                    />    
                </Box>
                <ButtonGroup sx={{marginRight: "1vh"}} variant="contained" aria-label="outlined primary button group">
                    
                    <Tooltip title="Новая диаграмма">
                        <Button onClick={()=>{
                            this.context.addNewDiagram(); 
                            trackEvent({ category: 'Header-Event', action: 'add-diagram-event' });
                        }}>
                            <AddIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip title={this.state.copyT}
                    onMouseLeave={()=>{
                        this.setState({ copyT: "Клонировать диаграмму" });
                    }}
                    >
                        <Button 
                            onClick={()=>{
                                this.context.addCopyDiagram(this.context.getActiveDiag())
                                this.setState({ copyT: "Диаграмма клонирована" });
                                trackEvent({ category: 'Header-Event', action: 'clone-diagram-event' });
                                }}>
                            <ContentCopyIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Скачать диаграмму">
                        <Button onClick={(e)=>{makeFile(this.context.getActiveDiag(), e);
                            trackEvent({ category: 'Header-Event', action: 'download-diagram-event' });
                        }}>
                            <FileDownloadIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Загрузить диаграмму">
                        <Button onClick={(e)=>{this.loadFile();
                            trackEvent({ category: 'Header-Event', action: 'upload-diagram-event' });
                        }}>
                            <FileUploadIcon/>
                        </Button>
                    </Tooltip>
                    
                    <Tooltip title={this.state.copyL}
                    onMouseLeave={()=>{
                        this.setState({ copyT: "Получить API ссылку" });
                    }}>
                        <Button onClick={()=>{
                            navigator.clipboard.writeText(getLink(this.context.getActiveDiag().type, this.context.getActiveDiag().code))
                            this.setState({ copyL: "Ссылка добавлена в буфер обмена" });
                            trackEvent({ category: 'Header-Event', action: 'getlink-diagram-event' });
                        }}>
                            <LinkIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Скачать изображение">
                        <Button onClick={()=>{makeImage(this.context.getActiveDiag().type, this.context.getActiveDiag().code, this.context.getActiveDiag().title)
                            trackEvent({ category: 'Header-Event', action: 'getimage-diagram-event' });
                        }}>
                            <ImageIcon/>
                        </Button>
                    </Tooltip>
                    <Badge color="secondary" badgeContent={Object.keys(this.context.data.diagrams).length}>
                        <IconButton onClick={() => {this.context.changeMenuState(true);
                            trackEvent({ category: 'Menu-Event', action: 'open-event' });
                        }}>
                        <KeyboardDoubleArrowLeftIcon />
                        </IconButton>
                    </Badge>
                    
                </ButtonGroup>
            </Box>
        );
    }
}

export default MatomoTracker(Header);
