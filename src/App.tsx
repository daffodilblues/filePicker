import './index.css'
import { Box } from '@chakra-ui/react';
import { useState, useEffect } from 'react'
// import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './utils/supabase_client';
import Home from './Home';

// const supabase = createClient('https://<project>.supabase.co', '<your-anon-key>')

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
    }).catch(error => console.error('Error fetching session:', error));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    });
    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return  <Box width="350px">
      <Auth supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            redirectTo={`${window.location.origin}`}
            queryParams={{
              prompt: 'select_account',
            }}
            providerScopes={{
              google: 'https://www.googleapis.com/auth/drive',
            }}
            // scopes={['https://www.googleapis.com/auth/drive']}
            />
    </Box>
  }
  else {
    return (<Home />)
  }
}

export default App;