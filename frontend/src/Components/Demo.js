import React from 'react';
import { Box, MenuItem, Select, Typography, IconButton, Paper, Modal } from '@mui/material';
import Split from 'react-split'
import GlobContext from './GlobContext';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SyncIcon from '@mui/icons-material/Sync';
import CloseIcon from '@mui/icons-material/Close';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-plant-uml';
import 'prismjs/components/prism-mermaid';
import 'prismjs/components/prism-dot';
import './prism.css';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { LanguageMapping, Templates, LanguageNaming } from './Constants';
import { Help, Psychology } from '@mui/icons-material';
import { resolveInclude } from './Include';
import { gptService } from '../services/gpt';
import ChatDialog from './ChatDialog';

const langMap = LanguageMapping;
const templ = Templates;
const langName = LanguageNaming;

const hightlightWithLineNumbers = (input, language) =>
  highlight(input, language)
    .split("\n")
    .map((line, i) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
    .join("\n");

class Demo extends React.Component {
  static contextType = GlobContext;

  constructor(props) {
    super(props);
    this.state = {
      infoOpen: false,
      chatOpen: false,
      chatMessages: [],
      chatLoading: false
    };
  }

  handleTypeChange = (event) => {
    if (this.context.getActiveDiag().code === templ[this.context.getActiveDiag().type]) {
      this.context.changeDiagramData("code", templ[event.target.value]);
    }
    this.context.changeDiagramData("type", event.target.value);
  };

  handleCodeChange = (code) => {
    this.context.changeDiagramData("code", code);
  };

  showInfo = () => {
    this.setState({ infoOpen: true });
    this.props.trackEvent({ category: 'INFO-Event', action: 'show-info-event' });
  };

  closeInfo = () => {
    this.setState({ infoOpen: false });
  };

  openChat = async () => {
    const { type, code } = this.context.getActiveDiag();
    this.setState({ 
      chatOpen: true,
      chatLoading: true,
      chatMessages: []
    });

    try {
      gptService.startNewChat();
      const analysis = await gptService.analyzeDiagram(type, code);
      this.setState({
        chatMessages: [
          { type: 'assistant', content: analysis }
        ]
      });
    } catch (error) {
      console.error('Failed to start chat:', error);
      this.setState({
        chatMessages: [
          { type: 'assistant', content: 'Извините, произошла ошибка при анализе диаграммы.' }
        ]
      });
    } finally {
      this.setState({ chatLoading: false });
    }
  };

  closeChat = async () => {
    await gptService.endChat();
    this.setState({ chatOpen: false });
  };

  handleChatMessage = async (message) => {
    const { type, code } = this.context.getActiveDiag();
    
    this.setState(state => ({
      chatLoading: true,
      chatMessages: [
        ...state.chatMessages,
        { type: 'user', content: message }
      ]
    }));

    try {
      const response = await gptService.chat(type, code, message);
      this.setState(state => ({
        chatMessages: [
          ...state.chatMessages,
          { type: 'assistant', content: response.message }
        ]
      }));
    } catch (error) {
      console.error('Chat error:', error);
      this.setState(state => ({
        chatMessages: [
          ...state.chatMessages,
          { type: 'assistant', content: 'Извините, произошла ошибка при обработке вашего сообщения.' }
        ]
      }));
    } finally {
      this.setState({ chatLoading: false });
    }
  };

  handleApplyCode = (code) => {
    this.handleCodeChange(code);
    this.props.trackEvent({ 
      category: 'GPT-Event', 
      action: 'apply-code'
    });
  };

  render() {
    const { infoOpen, chatOpen, chatMessages, chatLoading } = this.state;
    const activeDiag = this.context.getActiveDiag();

    return (
      <Box component="main">
        <Modal open={infoOpen} onClose={this.closeInfo}>
          <Paper sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: 'translate(-50%, -50%)',
            width: "60vw",
            padding: "2%"
          }}>
            <Box className="offcanvas-header">
              <Typography variant="h6">Diagram-as-Code + ChatGPT</Typography>
              <IconButton onClick={this.closeInfo}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Это приложение позволяет создавать и редактировать диаграммы с помощью кода.
              Теперь с поддержкой ChatGPT для:
              <ul>
                <li>Анализа диаграмм</li>
                <li>Внесения изменений</li>
                <li>Улучшения кода</li>
                <li>Объяснения структуры</li>
              </ul>
            </Typography>
          </Paper>
        </Modal>

        <ChatDialog
          open={chatOpen}
          onClose={this.closeChat}
          onSendMessage={this.handleChatMessage}
          onApplyCode={this.handleApplyCode}
          messages={chatMessages}
          loading={chatLoading}
        />

        <Split
          sizes={[70, 30]}
          minSize={[400, 200]}
          direction="horizontal"
          cursor="col-resize"
          gutterSize={10}
          style={{ width: "100%", display: "flex" }}
        >
          <Box component="form" noValidate className="code-block">
            <Box className="editorWrapper">
              <Editor
                value={activeDiag.code}
                onValueChange={this.handleCodeChange}
                highlight={code => 
                  hightlightWithLineNumbers(code, languages[langMap[activeDiag.type]])
                }
                style={{
                  fontFamily: "source-code-pro, Menlo, Monaco, Consolas, monospace",
                  fontSize: 14,
                }}
                padding={10}
                className="editor"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, p: 1, backgroundColor: '#f5f5f5' }}>
              <IconButton onClick={this.showInfo} title="Информация">
                <Help />
              </IconButton>
              <IconButton onClick={this.openChat} title="Chat GPT">
                <Psychology />
              </IconButton>
            </Box>

            <Box className="selector">
              <Typography variant="h6" component="p">
                Нотация:
              </Typography>
              <Select
                value={activeDiag.type}
                onChange={this.handleTypeChange}
                className="code"
              >
                <MenuItem value="plantuml">{langName.plantuml}</MenuItem>
                <MenuItem value="c4plantuml">{langName.c4plantuml}</MenuItem>
                <MenuItem value="mermaid">{langName.mermaid}</MenuItem>
                <MenuItem value="graphviz">{langName.graphviz}</MenuItem>
              </Select>
            </Box>
          </Box>

          <Box className="preview">
            <TransformWrapper
              initialScale={1}
              wheel={{ step: 0.5 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <React.Fragment>
                  <Box className="tools">
                    <IconButton onClick={zoomIn}><ZoomInIcon /></IconButton>
                    <IconButton onClick={zoomOut}><ZoomOutIcon /></IconButton>
                    <IconButton onClick={resetTransform}><CenterFocusStrongIcon /></IconButton>
                  </Box>
                  <TransformComponent>
                    <img 
                      src={this.context.data.krokiService.getDiagramUrl(
                        activeDiag.type,
                        resolveInclude(activeDiag.code, this.context.data.diagrams)
                      )}
                      alt="Diagram"
                      style={{ width: "95%", maxHeight: "95%" }}
                    />
                  </TransformComponent>
                </React.Fragment>
              )}
            </TransformWrapper>
          </Box>
        </Split>
      </Box>
    );
  }
}

export default function MatomoTrackerDemo(props) {
  const { trackEvent } = useMatomo();
  return <Demo {...props} trackEvent={trackEvent} />;
}
