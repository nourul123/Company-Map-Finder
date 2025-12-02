import React from 'react';
import { CompanyInfo, GroundingChunk } from '../types';

interface ResultCardProps {
  companyInfo: CompanyInfo;
  sources: GroundingChunk[];
}

const extractCleanUrl = (input: string): string => {
    if (!input || input === 'Not found' || input.toLowerCase() === 'none') return '#';
    
    // Regex to find the first valid URL pattern
    // Matches: http(s)://..., www...., or domain.com...
    // Stops at the first comma, whitespace, or bracket to avoid capturing lists/citations
    const match = input.match(/(https?:\/\/[^\s,\])]+)|(www\.[^\s,\])]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s,\])]*)?)/);
    
    if (match) {
        let url = match[0];
        // Remove trailing punctuation often captured (.,;)>)
        url = url.replace(/[.,;)>\]]+$/, "");
        
        // Basic validity check: must have at least one dot
        if (!url.includes('.')) return '#';

        if (url.startsWith('http')) return url;
        return `https://${url}`;
    }
    return '#';
};

const VerifiedCheck: React.FC = () => (
    <svg className="inline ml-2 h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" title="Verified on website">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const InfoRow: React.FC<{ label: string; value: string; isLink?: boolean; verified?: boolean }> = ({ label, value, isLink = false, verified = false }) => (
    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="mt-1 text-sm text-slate-200 sm:mt-0 sm:col-span-2 break-words flex items-center">
            <span className="flex-grow">
                {isLink && value !== 'Not found' ? (
                    <a href={extractCleanUrl(value)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        {value}
                    </a>
                ) : (
                    value
                )}
                {verified && <VerifiedCheck />}
            </span>
        </dd>
    </div>
);

const confidenceLevels: Record<string, {description: string; color: string; dotColor: string; borderColor: string;}> = {
  'Match – High Confidence': {
    description: 'The registry number appears on the website. -OR- The legal entity name, street address, and at least one officer/executive name matches.',
    color: 'bg-green-500/20 text-green-300',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-400/50'
  },
  'Match – Medium Confidence': {
    description: 'The legal entity name, city, and/or industry match, but there is no confirmed match of a street address or officer/executive.',
    color: 'bg-yellow-500/20 text-yellow-300',
    dotColor: 'bg-yellow-400',
    borderColor: 'border-yellow-400/50'
  },
  'Match – Low Confidence': {
    description: 'Domain matches casual/DBA names only. OR domain is verified by registries but is broken, requires login, or contains generic hosting content.',
    color: 'bg-orange-500/20 text-orange-300',
    dotColor: 'bg-orange-400',
    borderColor: 'border-orange-400/50'
  },
  'Non-Investable': {
    description: 'The matching domain is for a holding company or shell company and does not actually operate as an investable business.',
    color: 'bg-slate-500/20 text-slate-300',
    dotColor: 'bg-slate-400',
    borderColor: 'border-slate-400/50'
  },
  'No Match': {
    description: 'A domain could not be identified that meets any of the match criteria. If there is a suspected domain, add it to the Notes column.',
    color: 'bg-red-500/20 text-red-300',
    dotColor: 'bg-red-400',
    borderColor: 'border-red-400/50'
  }
};


const ConfidenceDisplay: React.FC<{ selectedLevel: string, justification: string }> = ({ selectedLevel, justification }) => {
  const selectedKey = Object.keys(confidenceLevels).find(key => selectedLevel.includes(key)) || 'No Match';
  const selectedConfidence = confidenceLevels[selectedKey];

  if (!selectedConfidence) {
    return null;
  }

  const { description, color, dotColor, borderColor } = selectedConfidence;

  return (
    <div className="border-t border-slate-700">
      <div className="px-4 py-5 sm:px-6">
        <h4 className="text-md font-semibold text-slate-300 mb-1">Confidence Level Assessment</h4>
        {justification && justification !== 'Not found' && (
            <p className="text-sm text-slate-400 mb-4 italic">"{justification}"</p>
        )}
        <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${color} ${borderColor} shadow-lg ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-slate-800`}>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${dotColor}`}></span>
              <h5 className="font-semibold text-white">{selectedKey}</h5>
            </div>
            <p className="mt-1.5 text-xs ml-6 text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
};


const ResultCard: React.FC<ResultCardProps> = ({ companyInfo, sources }) => {
  
  const isVerified = (key: string) => {
      if (!companyInfo.verifiedOnWebsite) return false;
      const verifiedList = companyInfo.verifiedOnWebsite.toLowerCase();
      return verifiedList.includes(key.toLowerCase());
  };

  const cleanParentUrl = extractCleanUrl(companyInfo.parentCompanySource);
  const cleanSubsidiariesUrl = extractCleanUrl(companyInfo.subsidiariesSource);

  // Check if we have valid URLs (extractCleanUrl returns '#' if invalid)
  const hasParentSource = companyInfo.parentCompanySource && 
                          companyInfo.parentCompanySource !== 'Not found' && 
                          cleanParentUrl !== '#';

  const hasSubsidiariesSource = companyInfo.subsidiariesSource && 
                                companyInfo.subsidiariesSource !== 'Not found' && 
                                cleanSubsidiariesUrl !== '#';

  const hasGeneralSources = sources.length > 0;
  const hasAnySources = hasParentSource || hasSubsidiariesSource || hasGeneralSources;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden border border-slate-700 animate-fade-in">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-xl leading-6 font-semibold text-cyan-300">
          {companyInfo.companyName || 'Company Information'}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Detailed information retrieved from online sources.
        </p>
      </div>
      <div className="border-t border-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <dl className="divide-y divide-slate-700">
                  <InfoRow 
                    label="Company Name" 
                    value={companyInfo.companyName} 
                    verified={isVerified('Company Name') || isVerified('Name')}
                  />
                  <InfoRow 
                    label="Registry Number" 
                    value={companyInfo.registryNumber} 
                    verified={isVerified('Registry Number') || isVerified('Registry')}
                  />
                  <InfoRow 
                    label="Location" 
                    value={companyInfo.location} 
                    verified={isVerified('Location') || isVerified('Address')}
                  />
                  <InfoRow 
                    label="Country" 
                    value={companyInfo.country} 
                    verified={isVerified('Country')}
                  />
                  <InfoRow label="Website" value={companyInfo.website} isLink={true} />
                </dl>
            </div>
            <div className="lg:col-span-2 lg:border-l border-slate-700">
                <div className="p-4 sm:p-6 h-full border-t border-slate-700 lg:border-t-0 flex flex-col gap-6">
                    <div>
                        <h4 className="text-md font-semibold text-slate-300 mb-2">Parent Company</h4>
                         <p className="text-sm text-slate-200 break-words mb-1">
                             {companyInfo.parentCompany && companyInfo.parentCompany !== 'Not found' ? companyInfo.parentCompany : <span className="text-slate-500 italic">None identified</span>}
                         </p>
                    </div>
                    
                    <div>
                        <h4 className="text-md font-semibold text-slate-300 mb-2">Subsidiaries</h4>
                        <p className="text-sm text-slate-200 whitespace-pre-line break-words mb-1">
                            {companyInfo.subsidiaries && companyInfo.subsidiaries !== 'Not found' ? companyInfo.subsidiaries : <span className="text-slate-500 italic">None identified</span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {companyInfo.websiteSummary && companyInfo.websiteSummary !== 'Not found' && (
        <div className="border-t border-slate-700 px-4 py-5 sm:px-6">
          <h4 className="text-md font-semibold text-slate-300 mb-2">Website Summary</h4>
          <blockquote className="border-l-4 border-cyan-500 pl-4">
            <p className="text-sm text-slate-400 italic">
              {companyInfo.websiteSummary}
            </p>
          </blockquote>
        </div>
      )}

      {companyInfo.BusinessActivities && companyInfo.BusinessActivities !== 'Not found' && (
        <div className="border-t border-slate-700 px-4 py-5 sm:px-6">
          <h4 className="text-md font-semibold text-slate-300 mb-2">Business Activities</h4>
          <p className="text-sm text-slate-400 whitespace-pre-line">{companyInfo.BusinessActivities}</p>
        </div>
      )}

      {companyInfo.KeyExecutives && companyInfo.KeyExecutives !== 'Not found' && (
        <div className="border-t border-slate-700 px-4 py-5 sm:px-6">
          <h4 className="text-md font-semibold text-slate-300 mb-2">Key Executives</h4>
          <p className="text-sm text-slate-400 whitespace-pre-line">{companyInfo.KeyExecutives}</p>
        </div>
      )}

      {companyInfo.RecentNewsSummary && companyInfo.RecentNewsSummary !== 'Not found' && (
        <div className="border-t border-slate-700 px-4 py-5 sm:px-6">
          <h4 className="text-md font-semibold text-slate-300 mb-2">Recent News Summary</h4>
          <p className="text-sm text-slate-400 whitespace-pre-line">{companyInfo.RecentNewsSummary}</p>
        </div>
      )}

      {companyInfo.confidenceLevel && companyInfo.confidenceLevel !== 'Not found' && (
        <ConfidenceDisplay 
            selectedLevel={companyInfo.confidenceLevel} 
            justification={companyInfo.justification}
        />
      )}

      {hasAnySources && (
        <div className="border-t border-slate-700 px-4 py-5 sm:px-6 bg-slate-800/30">
            <h4 className="text-md font-semibold text-slate-300 mb-4">Verified Sources</h4>
            
            {(hasParentSource || hasSubsidiariesSource) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 {hasParentSource && (
                   <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
                      <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Parent Company Proof</h5>
                      <a href={cleanParentUrl} target="_blank" rel="noopener noreferrer" className="flex items-start text-slate-300 hover:text-cyan-300 transition-colors group">
                          <svg className="flex-shrink-0 h-4 w-4 text-cyan-500 mr-2 mt-0.5 group-hover:text-cyan-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                               <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                               <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                          <span className="text-xs break-all">{companyInfo.parentCompanySource}</span>
                      </a>
                   </div>
                 )}
                 {hasSubsidiariesSource && (
                   <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
                      <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Subsidiaries Proof</h5>
                      <a href={cleanSubsidiariesUrl} target="_blank" rel="noopener noreferrer" className="flex items-start text-slate-300 hover:text-cyan-300 transition-colors group">
                          <svg className="flex-shrink-0 h-4 w-4 text-cyan-500 mr-2 mt-0.5 group-hover:text-cyan-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                               <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                               <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                          <span className="text-xs break-all">{companyInfo.subsidiariesSource}</span>
                      </a>
                   </div>
                 )}
              </div>
            )}

            {hasGeneralSources && (
                <div>
                     <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">General Company Information Sources</h5>
                     <ul className="space-y-2">
                        {sources.map((source, index) => (
                            source.web && (
                                <li key={index} className="flex items-start">
                                    <svg className="flex-shrink-0 h-4 w-4 text-green-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs break-all transition-colors">
                                        {source.web.title || source.web.uri}
                                    </a>
                                </li>
                            )
                        ))}
                     </ul>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ResultCard;