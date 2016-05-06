#!/usr/bin/perl

use strict;
use warnings;
use v5.10;
use FindBin qw/$Bin/;
use Getopt::Long;
use Text::Haml;
use Template;
use BOM::Platform::Runtime;
use BOM::Platform::Static::Config;
use BOM::Platform::Locale;
use BOM::Platform::Context qw/localize/;
use BOM::Platform::Context::Request;
use BOM::View::JavascriptConfig;
use BOM::View::CssConfig;
use BOM::View::Menu;
use Path::Tiny;
use HTML::Entities qw( encode_entities );
use Test::MockModule;
use Mojo::URL;

# force = re-generate files
# test  = for domain like http://fayland.github.io/binary-static-www2/ which has a sub path
my $force;
my $test;
GetOptions(
    "force|f" => \$force,
    "test|t"  => \$test,
);

my @langs = ('en', 'ar', 'de', 'es', 'fr', 'id', 'it', 'pl', 'pt', 'ru', 'vi', 'zh_cn', 'zh_tw');
my @m = (
    ['home',                'home/index',                 'haml', 'full_width'],
    ['why-us',              'static/why_us',              'haml', 'full_width'],
    ['payment-agent',       'static/payment_agent',       'haml', 'full_width'],
    ['contact',             'static/contact',             'haml', 'full_width'],
    ['tour',                'static/tour',                'haml', 'full_width'],
    ['responsible-trading', 'static/responsible_trading', 'haml', 'full_width'],
    ['terms-and-conditions',       'legal/tac',                   'toolkit', 'default', 'Terms and Conditions'],
    ['terms-and-conditions-jp',    'legal_jp/tacjp',              'toolkit', 'default', 'Terms and Conditions'],
    ['resources',                  'resources/index',             'haml',    'default'],
    ['charting',                   'charting/index',              'haml',    'default'],
    ['about-us',                   'about/index',                 'haml',    'full_width'],
    ['group-information',          'about/group-information',     'haml',    'default'],
    ['open-positions',             'static/job_descriptions',     'haml',    'full_width'],
    ['open-positions/job-details', 'static/job_details',          'haml',    'full_width'],
    ['careers',                    'static/careers',              'haml',    'full_width'],
    ['partners',                   'static/partners',             'haml',    'full_width'],
    ['group-history',              'static/group_history',        'haml',    'full_width'],
    ['smart-indices',              'static/smart_indices',        'haml',    'full_width'],
    ['open-source-projects',       'static/open_source_projects', 'haml',    'full_width'],
    ['styles',                     'home/styles',                 'haml',    'full_width'],
    ['affiliate/signup',           'affiliates/signup',           'toolkit', 'default'],
    ['user/logintrouble',          'misc/logintrouble',           'toolkit', 'default', 'Login trouble'],
    ['legal/us_patents',           'legal/us_patents',            'toolkit', 'default', 'US Patents'],
    ['cashier',                    'cashier/index',               'haml',    'default'],
    ['cashier/payment_methods',    'cashier/payment_methods',     'toolkit', 'default', 'Payment Methods'],
    # ['trade/bet_explanation', '']
    ['cashier/session_expired', 'cashier/session_expired', 'toolkit', 'default'],
    ['user-testing',            'static/user_testing',     'haml',    'full_width'],

    ['get-started',                              'get_started/index',                        'haml', 'get_started'],
    ['get-started/what-is-binary-trading',       'get_started/what_is_binary_trading',       'haml', 'get_started'],
    ['get-started/binary-options-basics',        'get_started/binary_options_basics',        'haml', 'get_started'],
    ['get-started/benefits-of-trading-binaries', 'get_started/benefits_of_trading_binaries', 'haml', 'get_started'],
    ['get-started/how-to-trade-binaries',        'get_started/how_to_trade_binaries',        'haml', 'get_started'],
    ['get-started/types-of-trades',              'get_started/types_of_trades',              'haml', 'get_started'],
    ['get-started/beginners-faq',                'get_started/beginners_faq',                'haml', 'get_started'],
    ['get-started/glossary',                     'get_started/glossary',                     'haml', 'get_started'],
    ['get-started/volidx-markets',               'get_started/volidx_markets',               'haml', 'full_width'],
    ['get-started/spread',                       'get_started/spread_bets',                  'haml', 'get_started'],

    ['get-started-jp', 'get_started_jp/get_started', 'toolkit', 'default', 'Get Started'],

    ## ws
    ['cashier/authenticatews',       'cashier/authenticatews',             'toolkit', 'default', 'Authenticate'],
    ['cashier/forwardws',            'cashier/deposit_withdraw_ws',        'toolkit', 'default', 'Cashier'],
    ['cashier/limitsws',             'account/trading_withdrawal_limitws', 'toolkit', 'default', 'Account Limits'],
    ['cashier/account_transferws',   'cashier/account_transferws',         'haml',    'default'],
    ['cashier/payment_agent_listws', 'cashier/payment_agent_listws',       'toolkit', 'default', 'Payment Agent Deposit'],
    ['cashier/top_up_virtualws',     'cashier/top_up_virtualws',           'toolkit', 'default', 'Give Me More Money!'],
    ['paymentagent/transferws',      'cashier/paymentagent_transferws',    'toolkit', 'default'],
    ['paymentagent/withdrawws',      'cashier/paymentagent_withdrawws',    'toolkit', 'default', 'Payment Agent Withdrawal'],

    ['jptrading', 'bet/static', 'toolkit', 'default', 'Sharp Prices. Smart Trading.'],
    ['trading',   'bet/static', 'toolkit', 'default', 'Sharp Prices. Smart Trading.'],

    ['new_account/virtualws',        'account/virtualws',      'toolkit', 'default', 'Create New Account'],
    ['new_account/realws',           'account/realws',         'toolkit', 'default', 'Real Money Account Opening'],
    ['new_account/japanws',          'account/japanws',        'toolkit', 'default', 'Real Money Account Opening'],
    ['new_account/maltainvestws',    'account/maltainvestws',  'toolkit', 'default', 'Financial Account Opening'],
    ['new_account/knowledge_testws', 'account/knowledge_test', 'toolkit', 'default', 'Real Money Account Opening'],

    ['resources/asset_indexws',  'resources/asset_indexws',  'toolkit', 'default', 'Asset Index'],
    ['resources/market_timesws', 'resources/market_timesws', 'toolkit', 'default', 'Trading Times'],

    ['user/api_tokenws',               'account/api_tokenws',            'toolkit', 'default', 'API Token'],
    ['user/change_passwordws',         'account/change_passwordws',      'toolkit', 'default', 'Change Password'],
    ['user/openpositionsws',           'account/openpositionsws',        'toolkit', 'default', 'Portfolio'],
    ['user/profit_tablews',            'account/profit_tablews',         'toolkit', 'default', 'Profit Table'],
    ['user/self_exclusionws',          'account/self_exclusionws',       'toolkit', 'default', 'Account Details'],
    ['user/settings/detailsws',        'account/settings_detailsws',     'toolkit', 'default', 'Personal Details'],
    ['user/settings/securityws',       'cashier/settings_securityws',    'haml',    'default', 'Security'],
    ['user/statementws',               'account/statementws',            'toolkit', 'default', 'Statement'],
    ['user/my_accountws',              'homepage/logged_inws',           'toolkit', 'default', 'My Account'],
    ['user/settingsws',                'account/settingsws',             'toolkit', 'default', 'Settings'],
    ['user/iphistoryws',               'account/iphistory',              'toolkit', 'default', 'Login History'],
    ['user/tnc_approvalws',            'legal/tnc_approvalws',           'toolkit', 'default', 'Terms and Conditions Approval'],
    ['user/assessmentws',              'account/financial_assessmentws', 'toolkit', 'default', 'Financial Assessment'],
    ['user/lost_passwordws',           'user/lost_passwordws',           'haml',    'default'],
    ['user/reset_passwordws',          'user/reset_passwordws',          'haml',    'default'],
    ['user/applicationsws',            'account/applications',           'toolkit', 'default', 'Applications'],
    ['user/reality_check_frequencyws', 'user/reality_check_frequencyws', 'haml',    'default'],
    ['user/reality_check_summaryws',   'user/reality_check_summaryws',   'haml',    'default'],
);

## config
our $LANG = 'en';
my $root_path = "$Bin/..";
my $dist_path = "$root_path/dist";
our %HTML_URLS = map { '/' . $_->[0] => 1 } @m;

## do some mockup
my $mock = Test::MockModule->new('BOM::Platform::Static::Config');
$mock->mock(
    get_config => sub {
        return {binary_static_hash => '_=v1'};    ## increase it when new version is deployed
    });
$mock->mock(
    get_static_path => sub {
        return "$root_path/src";
    });

my $old_sub = \&BOM::Platform::Context::Request::url_for;
my $mock2   = Test::MockModule->new('BOM::Platform::Context::Request');
$mock2->mock(
    url_for => sub {
        my ($self, @args) = @_;

        # print Dumper(\@args); use Data::Dumper;
        my $url = $args[0] || '';

        # quick fix
        $url = '/' . $url if grep { $url eq $_ } (map { $_->[0] } @m);

        my $domain_prefix = $test ? '/binary-static-www2/' : '/';
        if ($url =~ m{^/?(images|css|scripts)/}) {
            $url =~ s/^\///;
            return Mojo::URL->new($domain_prefix . $url);
        }
        if ($HTML_URLS{$url}) {
            $url =~ s/^\///;
            return Mojo::URL->new($domain_prefix . "$LANG/$url.html");
        }
        # /terms-and-conditions#privacy-tab
        my ($upre, $upost) = ($url =~ /^(.*?)\#(.*?)$/);
        if ($upost and $HTML_URLS{$upre}) {
            $upre =~ s/^\///;
            return Mojo::URL->new($domain_prefix . "$LANG/$upre.html#$upost");
        }
        # for link alternate
        my $query = $args[1] || {};
        if ($query->{l} and $query->{l} ne $LANG) {
            # /binary-static-www2/en/home.html
            $url =~ s{^(/binary-static-www2)?/(\w+)/(.+)\.html$}{/$3};
            if ($HTML_URLS{$url}) {
                $url =~ s/^\///;
                return Mojo::URL->new($domain_prefix . lc($query->{l}) . "/$url.html");
            }
        }

        # $args[2] ||= { no_lang => 1};
        # $args[2]->{no_lang} = 1;

        # print STDERR $url . "\n";
        return $old_sub->($self, @args);
    });

foreach my $m (@m) {
    my $save_as  = $m->[0];
    my $tpl_path = $m->[1];
    my $tpl_type = $m->[2];
    my $layout   = $m->[3];
    my $title    = $m->[4];
    my $file     = "$root_path/src/templates/$tpl_type/$tpl_path.html.$tpl_type";
    if ($tpl_type eq 'toolkit') {
        $file = "$tpl_path.html.tt";    # no Absolute path
    }
    my $layout_file = "$root_path/src/templates/$tpl_type/layouts/$layout.html.$tpl_type";
    if ($tpl_type eq 'toolkit') {
        $layout_file = "layouts/$layout.html.tt";    # no Absolute path
    }
    foreach my $lang (@langs) {
        my $save_as_file = "$dist_path/$lang/pjax/$save_as.html";
        next if -e $save_as_file and not $force;

        mkdir("$dist_path/$lang")      unless -d "$dist_path/$lang";
        mkdir("$dist_path/$lang/pjax") unless -d "$dist_path/$lang/pjax";
        my $request = BOM::Platform::Context::Request->new(
            domain_name => 'www.binary.com',
            language    => uc $lang,
        );
        BOM::Platform::Context::request($request);

        my $current_route = $save_as;
        $current_route =~ s{^(.+)/}{}sg;

        my %stash = (
            website_name  => $request->website->display_name,
            request       => $request,
            website       => $request->website,
            domain_name   => $request->domain_name,
            language      => uc $lang,
            current_path  => $save_as,
            current_route => $current_route,
        );

        if ($save_as =~ m{terms-and-conditions}) {
            $stash{website}         = $request->website->display_name;
            $stash{affiliate_email} = BOM::Platform::Runtime->instance->app_config->marketing->myaffiliates_email;
        } elsif ($save_as =~ m{affiliate/signup}) {
            $stash{title}           = localize('Affiliate');
            $stash{affiliate_email} = BOM::Platform::Runtime->instance->app_config->marketing->myaffiliates_email;
            $stash{commission_data} = {
                min_commission => 20,
                max_commission => 35,
                first_tier     => {
                    'min' => 0,
                    'max' => '$10,000'
                },
                second_tier => {
                    'min'  => '$10,001',
                    'max'  => '$50,000',
                    'rate' => 25
                },
                third_tier => {
                    'min'  => '$50,001',
                    'max'  => '$100,000',
                    'rate' => 30
                },
                fourth_tier => {'min' => '$100,001'},
            };
        } elsif ($save_as =~ m{logintrouble}) {
            $stash{body_id} = 'header_page';
        } elsif ($save_as =~ m{us_patents}) {
            $stash{us_patents} = [{
                    title => localize('Betting system and method'),
                    url   => 'http://www.google.com/patents/US7206762',
                },
                {
                    title => localize('Computer trading system for offering custom financial market speculations'),
                    url   => 'http://www.google.com/patents/US8046293'
                },
                {
                    title => localize('Computer system and method for speculating on a financial market'),
                    url   => 'http://www.google.com/patents/US8046292'
                },
            ];
        } elsif ($save_as eq 'cashier') {
            $stash{deposit_url}  = $request->url_for('/cashier/forward', {act => 'deposit'});
            $stash{withdraw_url} = $request->url_for('/cashier/forward', {act => 'withdraw'});
        } elsif ($save_as eq 'cashier/payment_methods') {
            $stash{deposit_url}  = $request->url_for('/cashier/forward', {act => 'deposit'});
            $stash{withdraw_url} = $request->url_for('/cashier/forward', {act => 'withdraw'});
        } elsif ($save_as =~ 'cashier/payment_agent_list') {
            $stash{website}                 = $request->website->display_name;
            $stash{apply_payment_agent_url} = $request->url_for('/payment-agent');
        }

        if ($title) {
            $stash{title} = localize($title);
        }

        # my $page_name  = '/' . $save_as;
        # my $page_rules = YAML::XS::LoadFile('/home/git/regentmarkets/bom-platform/config/page_caching_rules.yml')->{$page_name};
        # my $page_caching_rules = $page_rules->{header};
        # if ($page_caching_rules) {
        #     foreach my $key (keys %{$page_caching_rules}) {
        #         if (not $page_rules->{exclude_appcache} and $page_caching_rules->{$key} =~ /s-maxage=(\d+)/ and $1 > 25000) {
        #             $stash{appcache_manifest} = 1;
        #         }
        #     }
        # }

        my $output;
        if ($tpl_type eq 'haml') {
            $output = haml_handle($file, %stash);
        } else {
            $output = tt2_handle($file, %stash);
        }

        say $save_as_file;
        my $path = path($save_as_file);
        $path->parent->mkpath if $save_as =~ '/';
        $path->spew_utf8($output);

        ## do with wrapper
        $save_as_file   = "$dist_path/$lang/$save_as.html";
        $stash{content} = $output;
        $output         = '';
        if ($tpl_type eq 'haml') {
            $output = haml_handle($layout_file, %stash);
        } else {
            $output = tt2_handle($layout_file, %stash);
        }
        $path = path($save_as_file);
        $path->parent->mkpath if $save_as =~ '/';
        $path->spew_utf8($output);

        # exit;
    }
}

sub haml_handle {
    my ($file, %stash) = @_;

    my $haml = Text::Haml->new(cache => 0);
    if ($file =~ 'layout') {
        $haml->escape_html(0);
    }
    $haml->add_helper(
        stash => sub {
            my $self = shift;
            if (@_ > 1 || ref($_[0])) {
                return %stash = (%stash, (@_ > 1 ? @_ : %{$_[0]}));
            } elsif (@_) {
                return $stash{$_[0]} // '';
            } else {
                return \%stash;
            }
        });
    $haml->add_helper(
        l => sub {
            my $self = shift;
            return localize(@_);
        });

    $haml->add_helper(
        encode_html_text => sub {
            my ($self, $text) = @_;
            return encode_entities($text);
        });
    $haml->add_helper(
        available_languages => sub {
            my ($c)           = @_;
            my @allowed_langs = @{BOM::Platform::Static::Config::get_display_languages()};
            my $al            = {};
            map { $al->{$_} = BOM::Platform::Locale::_lang_display_name($_) } @allowed_langs;
            return $al;
        });

    $haml->add_helper(
        js_configs => sub {
            return BOM::View::JavascriptConfig->instance->config_for();
        });

    $haml->add_helper(
        menu => sub {
            my ($c) = @_;
            return BOM::View::Menu->new();
        });

    $haml->add_helper(
        css => sub {
            my ($c) = @_;
            return BOM::View::CssConfig->new();
        });

    my $request      = $stash{request};
    my $current_path = $stash{current_path};
    $haml->add_helper(
        url_for => sub {
            my $self = shift;
            return $request->url_for(@_);
        });
    $haml->add_helper(
        get_current_path => sub {
            my $self = shift;
            return $request->url_for($current_path, undef, {no_lang => 1});
        });
    $haml->add_helper(
        current_route => sub {
            return $stash{current_route};
        });
    $haml->add_helper(
        content => sub {
            return $stash{content};
        });

    $haml->add_helper(
        include => sub {
            my ($self, $tpl) = (shift, shift);
            my $x = $haml->render_file("$root_path/src/templates/haml/$tpl.html.haml", %stash, @_)
                or die $haml->error;
            # say "$tpl get $x";
            return $x;
        });

    # FIXME
    $haml->add_helper(google_tag_tracking_code => sub { });

    my $output = $haml->render_file($file, %stash) or die $haml->error;

    return $output;
}

sub tt2_handle {
    my ($file, %stash) = @_;

    my $tt2 = &BOM::Platform::Context::template();

    my $request = $stash{request};

    $stash{javascript}       = BOM::View::JavascriptConfig->instance->config_for();
    $stash{css_files}        = [BOM::View::CssConfig->new()->files];
    $stash{iso639a_language} = $request->language;
    $stash{icon_url}         = $request->url_for('images/common/favicon_1.ico');
    $stash{lang}             = $request->language;
    $stash{language_select}  = BOM::Platform::Locale::language_selector();
    $stash{menu}             = BOM::View::Menu->new();

    my $output = '';
    $tt2->process($file, \%stash, \$output) or die $tt2->error(), "\n";

    return $output;
}

1;
