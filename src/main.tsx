// 注意，polyfill 必须放在顶部
import './polyfill';
import 'antd/dist/antd.css';
import * as ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import {
  Layout,
  Row,
  Col,
  Card,
  Collapse,
  Typography,
  Input,
  Button,
  Space,
  Radio,
  Tag,
  Popover,
  Tooltip,
  PageHeader,
} from 'antd';
import Perspectives from './perspective.json';
import Scores from './score.json';
import { useMemo, useReducer, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { CopyOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { calcScores, ExpectationMap, matchScore, SortedScores } from './calc';
import Expectation from './expectation.json';

type PerspectiveKey = typeof Perspectives[number]['key'];

type ScoreCredit = typeof Scores[number]['score'];

const App = () => {
  const [comments, updateComments] = useReducer(
    (
      state: { [key: string]: string },
      action: { key: PerspectiveKey; content: string }
    ) => ({
      ...state,
      [action.key]: action.content,
    }),
    {}
  );

  const [scores, updateScores] = useReducer(
    (
      state: { [key: string]: number },
      action: { key: PerspectiveKey; score: number }
    ) => ({
      ...state,
      [action.key]: action.score,
    }),
    Perspectives.reduce<{ [key: string]: number }>((scores, p) => {
      scores[p.key] = 0;
      return scores;
    }, {})
  );

  const [summary, setSummary] = useState<string>();

  const [expectation, setExpectation] = useState<string>(Expectation[0].name);

  const weights = useMemo<{ [key: string]: number }>(
    () => ExpectationMap[expectation],
    [expectation]
  );

  const credit = useMemo<ScoreCredit>(
    () => matchScore(calcScores(scores, weights)),
    [scores, expectation]
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ backgroundColor: '#fff', padding: '2rem' }}>
        <Card style={{ borderBottom: 0, borderRadius: 0 }}>
          <PageHeader
            title={<Typography.Title level={1}>{credit}</Typography.Title>}
            subTitle={
              <>
                总分
                <Popover
                  content={
                    <Typography>
                      总分会根据各项分数自动计算
                      <ul style={{ marginTop: '0.5rem' }}>
                        <li>
                          <Typography.Text type="secondary">
                            先选择期望，不同期望下不同方面考察点的权重不同，可以在相应标题旁看到比重（
                            目前是写死的，多种期望策略配置尽情期待 ）
                          </Typography.Text>
                        </li>
                        <li>
                          档位有 9 档，评分与计算分数的关系为：
                          <ul style={{ marginTop: '0.5rem' }}>
                            {SortedScores.map(e => (
                              <li key={`tip-${e.value}`}>
                                <Typography.Text strong>
                                  {e.score}
                                </Typography.Text>
                                : {e.value}
                              </li>
                            ))}
                          </ul>
                        </li>
                        <li>
                          但在计算最终得分时，用来卡分的合格线，是每一档分数与比其低一档的分数的平均值
                          <ul style={{ marginTop: '0.5rem' }}>
                            <li>
                              这样是为了避免如四项得分分别为 3、3、3、2.5+
                              时就一定到不了 3 的情况
                            </li>
                          </ul>
                        </li>
                        <li>默认每一项都为零分，表示未考察</li>
                        <li>
                          若对某一项进行打分，该项得分会被计入权重，自动计算得到总分
                        </li>
                        <li>
                          允许最终存在未考察的项，该项的 0
                          分不会计入权重，不影响总分
                          <ul style={{ marginTop: '0.5rem' }}>
                            <li>
                              如：只有一项 0.4 被评估时，实际权重是 0.4 / 0.4 =
                              1
                            </li>
                            <li>
                              如：有 0.4 和 0.1 两项被评估时，0.4 的实际权重是
                              0.4 / (0.4 + 0.1) = 0.8
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </Typography>
                  }
                  title={
                    <Typography.Title level={4} style={{ marginTop: '0.5rem' }}>
                      分数计算说明
                    </Typography.Title>
                  }
                  trigger="click"
                >
                  <QuestionCircleOutlined style={{ marginLeft: '0.5rem' }} />
                </Popover>
              </>
            }
            extra={
              <Radio.Group
                buttonStyle="solid"
                onChange={e => setExpectation(e.target.value)}
                defaultValue={expectation}
              >
                {Expectation.map(s => (
                  <Radio.Button value={s.name} key={s.name}>
                    {s.desc}
                  </Radio.Button>
                ))}
              </Radio.Group>
            }
          ></PageHeader>
        </Card>
        <Collapse
          defaultActiveKey={Perspectives.map(p => p.key).concat('summary')}
          style={{ borderRadius: 0 }}
        >
          <Collapse.Panel
            header={<Typography.Text strong>综合评价</Typography.Text>}
            key="summary"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Input.TextArea
                  placeholder="请输入"
                  rows={8}
                  onChange={e => setSummary(e.target.value)}
                ></Input.TextArea>
              </Col>
              <Col span={12}>
                <Card style={{ borderColor: '#ececec', height: '100%' }}>
                  <Space direction="vertical" size="large">
                    <Tooltip title="复制的是纯文本，而非 Markdown 格式富文本。原因是 Moka 系统只支持纯文本">
                      <CopyToClipboard text={summary || ''}>
                        <Button>
                          <CopyOutlined />
                          Copy
                        </Button>
                      </CopyToClipboard>
                    </Tooltip>
                    <Typography.Text type="secondary">
                      <ReactMarkdown children={summary || '无'}></ReactMarkdown>
                    </Typography.Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Collapse.Panel>
          {Perspectives.map(p => (
            <Collapse.Panel
              header={
                <>
                  <Typography.Text strong>{p.title}</Typography.Text>
                  <Tag color="#2db7f5" style={{ marginLeft: '0.5rem' }}>
                    {weights[p.key] * 100}%
                  </Tag>
                </>
              }
              key={p.key}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <ul>
                    {(p.desc ?? []).map((des: string) => (
                      <li key={des}>
                        <Typography>{des}</Typography>
                      </li>
                    ))}
                  </ul>
                  <Input.TextArea
                    placeholder="请输入"
                    rows={8}
                    onChange={e =>
                      updateComments({
                        key: p.key,
                        content: e.target.value,
                      })
                    }
                  ></Input.TextArea>
                  <Radio.Group
                    onChange={e =>
                      updateScores({
                        key: p.key,
                        score: e.target.value,
                      })
                    }
                    value={scores[p.key]}
                    style={{ marginTop: '1rem' }}
                  >
                    {SortedScores.map(e => (
                      <Radio value={e.value} key={`${p.key}-${e.value}`}>
                        {e.score}
                      </Radio>
                    ))}
                  </Radio.Group>
                </Col>
                <Col span={12}>
                  <Card style={{ borderColor: '#ececec', height: '100%' }}>
                    <Space direction="vertical" size="large">
                      <Tooltip title="复制的是纯文本，而非 Markdown 格式富文本。原因是 Moka 系统只支持纯文本">
                        <CopyToClipboard text={comments[p.key]}>
                          <Button>
                            <CopyOutlined />
                            Copy
                          </Button>
                        </CopyToClipboard>
                      </Tooltip>
                      <Typography.Text type="secondary">
                        <ReactMarkdown
                          children={comments[p.key] || '无'}
                        ></ReactMarkdown>
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Collapse.Panel>
          ))}
        </Collapse>
      </Layout.Content>
      <Layout.Footer style={{ textAlign: 'center', color: 'grey' }}>
        ©Copyright by ChenYn
      </Layout.Footer>
    </Layout>
  );
};

ReactDOM.render(
  // <React.StrictMode>
  <App />,
  // </React.StrictMode>,
  document.getElementById('root')
);
