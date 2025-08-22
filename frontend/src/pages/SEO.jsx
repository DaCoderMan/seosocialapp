import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const SEO = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analyze');
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [keywordResults, setKeywordResults] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [seoMetrics, setSeoMetrics] = useState(null);

  useEffect(() => {
    loadAnalysisHistory();
    loadSEOMetrics();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      const response = await api.get('/seo/history', { params: { limit: 5 } });
      setAnalysisHistory(response.data.data);
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const loadSEOMetrics = async () => {
    try {
      const response = await api.get('/seo/metrics');
      setSeoMetrics(response.data.data);
    } catch (error) {
      console.error('Error loading SEO metrics:', error);
    }
  };

  const handleAnalyzeUrl = async (e) => {
    e.preventDefault();
    if (!analysisUrl.trim()) {
      toast.error('Please enter a URL to analyze');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/seo/analyze', {
        url: analysisUrl,
        analysisType: 'page'
      });

      setAnalysisResults(response.data.data);
      toast.success('SEO analysis completed successfully!');
      loadAnalysisHistory(); // Refresh history
    } catch (error) {
      toast.error(error.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordResearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast.error('Please enter a keyword to research');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/seo/keywords/${encodeURIComponent(keyword)}`);
      setKeywordResults(response.data.data);
      toast.success('Keyword research completed!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Keyword research failed');
    } finally {
      setLoading(false);
    }
  };

  const SEOScoreCard = ({ score, title, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{score || 0}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <i className={`fas fa-chart-line text-2xl text-${color}-600`}></i>
        </div>
      </div>
    </div>
  );

  const AnalysisResultCard = ({ title, data, icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-lg bg-${color}-100 mr-3`}>
          <i className={`fas ${icon} text-${color}-600`}></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {data.content && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Content:</p>
          <p className="text-sm bg-gray-50 p-3 rounded border-l-2 border-gray-200">
            {data.content.length > 100 ? `${data.content.substring(0, 100)}...` : data.content}
          </p>
        </div>
      )}

      {data.length !== undefined && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Length:</p>
          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-900">{data.length}</span>
            <span className="text-sm text-gray-500 ml-2">characters</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Score:</p>
        <div className="flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
            <div
              className={`h-2 rounded-full ${
                data.score >= 80 ? 'bg-green-500' :
                data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.score}%` }}
            ></div>
          </div>
          <span className="text-sm font-semibold text-gray-900">{data.score}%</span>
        </div>
      </div>

      {data.suggestions && data.suggestions.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
          <ul className="space-y-1">
            {data.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* SEO Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SEOScoreCard
          score={seoMetrics?.averageScore?.toFixed(1)}
          title="Average SEO Score"
          color="blue"
        />
        <SEOScoreCard
          score={seoMetrics?.totalAnalyses}
          title="Total Analyses"
          color="green"
        />
        <SEOScoreCard
          score={seoMetrics?.averageTechnicalScore?.toFixed(1)}
          title="Technical Score"
          color="purple"
        />
        <SEOScoreCard
          score={seoMetrics?.averageTitleScore?.toFixed(1)}
          title="Title Score"
          color="yellow"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'analyze', name: 'URL Analysis', icon: 'fa-search' },
              { id: 'keywords', name: 'Keyword Research', icon: 'fa-key' },
              { id: 'history', name: 'Analysis History', icon: 'fa-history' },
              { id: 'optimize', name: 'Content Optimization', icon: 'fa-magic' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* URL Analysis Tab */}
          {activeTab === 'analyze' && (
            <div className="space-y-6">
              <form onSubmit={handleAnalyzeUrl} className="flex gap-4">
                <input
                  type="url"
                  value={analysisUrl}
                  onChange={(e) => setAnalysisUrl(e.target.value)}
                  placeholder="Enter URL to analyze (e.g., https://example.com)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search mr-2"></i>
                      Analyze
                    </>
                  )}
                </button>
              </form>

              {analysisResults && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Analysis Results</h2>
                        <p className="text-blue-100">Overall SEO Score: {analysisResults.overallScore}%</p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold">
                          {analysisResults.overallScore >= 80 ? 'A' :
                           analysisResults.overallScore >= 70 ? 'B' :
                           analysisResults.overallScore >= 60 ? 'C' : 'F'}
                        </div>
                        <div className="text-sm text-blue-100">Grade</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnalysisResultCard
                      title="Title Tag"
                      data={analysisResults.results.title}
                      icon="fa-heading"
                      color="blue"
                    />
                    <AnalysisResultCard
                      title="Meta Description"
                      data={analysisResults.results.metaDescription}
                      icon="fa-file-text"
                      color="green"
                    />
                    <AnalysisResultCard
                      title="Headings Structure"
                      data={analysisResults.results.headings}
                      icon="fa-list-ol"
                      color="purple"
                    />
                    <AnalysisResultCard
                      title="Content Analysis"
                      data={analysisResults.results.content}
                      icon="fa-file-alt"
                      color="yellow"
                    />
                    <AnalysisResultCard
                      title="Images"
                      data={analysisResults.results.images}
                      icon="fa-image"
                      color="indigo"
                    />
                    <AnalysisResultCard
                      title="Technical SEO"
                      data={analysisResults.results.technical}
                      icon="fa-cog"
                      color="red"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keyword Research Tab */}
          {activeTab === 'keywords' && (
            <div className="space-y-6">
              <form onSubmit={handleKeywordResearch} className="flex gap-4">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter keyword to research (e.g., SEO tools)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Researching...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search mr-2"></i>
                      Research
                    </>
                  )}
                </button>
              </form>

              {keywordResults && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Keyword Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-green-600">Total Search Volume:</span>
                        <p className="font-semibold text-green-800">{keywordResults.totalSearchVolume.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-green-600">Average Difficulty:</span>
                        <p className="font-semibold text-green-800">{keywordResults.averageDifficulty.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-green-600">Related Keywords:</span>
                        <p className="font-semibold text-green-800">{keywordResults.relatedKeywords.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900">Related Keywords</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {keywordResults.relatedKeywords.map((kw, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{kw.keyword}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{kw.searchVolume.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  kw.difficulty < 30 ? 'bg-green-100 text-green-800' :
                                  kw.difficulty < 50 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {kw.difficulty}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  kw.opportunity > 70 ? 'bg-green-100 text-green-800' :
                                  kw.opportunity > 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {kw.opportunity}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h3>
              {analysisHistory.length > 0 ? (
                analysisHistory.map((analysis) => (
                  <div key={analysis._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{analysis.url}</h4>
                        <p className="text-sm text-gray-500">
                          Analyzed on {new Date(analysis.createdAt).toLocaleDateString()} at {new Date(analysis.createdAt).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Status: <span className={`font-medium ${
                            analysis.status === 'completed' ? 'text-green-600' :
                            analysis.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                          }`}>{analysis.status}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        {analysis.overallScore && (
                          <div className="text-2xl font-bold text-gray-900">{analysis.overallScore}%</div>
                        )}
                        <div className="text-sm text-gray-500">SEO Score</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-4"></i>
                  <p>No analysis history found</p>
                  <p className="text-sm">Start by analyzing your first URL</p>
                </div>
              )}
            </div>
          )}

          {/* Content Optimization Tab */}
          {activeTab === 'optimize' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Content Optimization Tool</h3>
                <p className="text-blue-700 text-sm">
                  This feature will help you optimize your content for better SEO performance. Coming soon!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEO;


